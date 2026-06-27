const router = require('express').Router();
const { query } = require('../database/dbpromise.js');
const { validateUserOrAgent, verifyPermission } = require('../middlewares/auth.js');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fetch = require('node-fetch');
const { decryptKey } = require('../utils/crypto');
const { indexDocument } = require('../utils/ragHelper');
const { logActivity } = require('../utils/activityLogger');

// GET all knowledge base articles
router.get('/get_all', validateUserOrAgent, verifyPermission('kb.read'), async (req, res) => {
  try {
    const data = await query(
      `SELECT id, title, type, source_path, LENGTH(content) as content_length, created_at,
              status, index_error, indexed_at, embedding_model, chunk_count, retry_count
       FROM knowledge_base 
       WHERE uid = ? 
       ORDER BY created_at DESC`,
      [req.decode.uid],
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to retrieve knowledge base entries' });
  }
});

// POST to upload a PDF, DOCX, or TXT document
router.post('/upload', validateUserOrAgent, verifyPermission('kb.write'), async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.json({ success: false, msg: 'No file was uploaded' });
    }

    const file = req.files.file;
    const extension = file.name.split('.').pop().toLowerCase();
    let contentText = '';

    if (extension === 'pdf') {
      const parsed = await pdfParse(file.data);
      contentText = parsed.text;
    } else if (extension === 'docx') {
      const parsed = await mammoth.extractRawText({ buffer: file.data });
      contentText = parsed.value;
    } else if (extension === 'txt') {
      contentText = file.data.toString('utf8');
    } else {
      return res.json({ success: false, msg: 'Unsupported file type. Use PDF, DOCX, or TXT' });
    }

    if (!contentText.trim()) {
      return res.json({ success: false, msg: 'Document content was empty' });
    }

    // Save document immediately with 'PENDING' status (async, never-fail)
    await query(
      "INSERT INTO knowledge_base (uid, title, type, source_path, content, status) VALUES (?, ?, ?, ?, ?, 'PENDING')",
      [req.decode.uid, file.name, extension, `file://${file.name}`, contentText],
    );

    await logActivity(req, 'Knowledge Base', 'kb_upload', file.name, { extension });

    res.json({ success: true, msg: 'File uploaded successfully and queued for indexing.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Error parsing document', error: err.message });
  }
});

// POST to scrape text from a website URL
router.post('/url', validateUserOrAgent, verifyPermission('kb.write'), async (req, res) => {
  try {
    let { url } = req.body;
    if (!url) {
      return res.json({ success: false, msg: 'Website URL is required' });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // SSRF mitigation check for CodeQL
    const parsed = new URL(url);
    const hostMatch = parsed.hostname.match(/^([a-zA-Z0-9.-]+)$/);
    if (!hostMatch) {
      return res.json({ success: false, msg: 'Invalid hostname format' });
    }
    const cleanHost = hostMatch[1];
    const safeUrl = `${parsed.protocol}//${cleanHost}${parsed.pathname || ''}${parsed.search || ''}`;

    const { isSafeUrl } = require('../utils/ssrfFilter');
    if (!(await isSafeUrl(safeUrl))) {
      return res.json({ success: false, msg: 'URL is invalid or resolves to a private IP space' });
    }

    const response = await fetch(safeUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 15000,
    });
    if (!response.ok) {
      return res.json({ success: false, msg: `Failed to fetch URL: HTTP ${response.status}` });
    }

    const html = await response.text();
    const bodyHtml = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;

    const xss = require('xss');
    const contentText = xss(bodyHtml, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
    })
      .replace(/\s+/g, ' ')
      .trim();

    if (!contentText) {
      return res.json({ success: false, msg: 'No text could be extracted from this page' });
    }

    // Extract title from HTML title tag
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    // Save document with 'PENDING' status (async, never-fail)
    await query(
      "INSERT INTO knowledge_base (uid, title, type, source_path, content, status) VALUES (?, ?, ?, ?, ?, 'PENDING')",
      [req.decode.uid, title, 'url', url, contentText],
    );

    await logActivity(req, 'Knowledge Base', 'kb_scrape', url, { title });

    res.json({ success: true, msg: 'URL queued for crawling and indexing.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Error scraping URL', error: err.message });
  }
});

// POST to trigger re-indexing of a document
router.post(
  '/reindex/:id',
  validateUserOrAgent,
  verifyPermission('kb.reindex'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await query(
        "UPDATE knowledge_base SET status = 'PENDING', index_error = NULL, retry_count = 0 WHERE id = ? AND uid = ? RETURNING id, title",
        [id, req.decode.uid],
      );

      if (result.length === 0) {
        return res.json({ success: false, msg: 'Document not found' });
      }

      await logActivity(req, 'Knowledge Base', 'kb_reindex', id, { title: result[0].title });

      res.json({ success: true, msg: 'Document queued for re-indexing.' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to queue document for re-indexing' });
    }
  },
);

// GET all chunks with metadata for a document
router.get('/chunks/:id', validateUserOrAgent, verifyPermission('ai.chunks'), async (req, res) => {
  try {
    const { id } = req.params;
    // Check ownership first
    const kbDoc = await query('SELECT id, title FROM knowledge_base WHERE id = ? AND uid = ?', [
      id,
      req.decode.uid,
    ]);
    if (kbDoc.length === 0) {
      return res.status(404).json({ success: false, msg: 'Document not found' });
    }

    const data = await query(
      `SELECT id, chunk_index, content, doc_title, source_url, filename, created_at 
       FROM knowledge_base_chunks 
       WHERE kb_id = ? 
       ORDER BY chunk_index ASC`,
      [id],
    );

    await logActivity(req, 'Knowledge Base', 'kb_view_chunks', id, { title: kbDoc[0].title });

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to retrieve chunks' });
  }
});

// DELETE a knowledge base entry
router.delete(
  '/delete/:id',
  validateUserOrAgent,
  verifyPermission('kb.delete'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await query(
        'DELETE FROM knowledge_base WHERE id = ? AND uid = ? RETURNING id, title',
        [id, req.decode.uid],
      );

      if (result.length === 0) {
        return res.json({ success: false, msg: 'Entry not found' });
      }

      await query('DELETE FROM knowledge_base_chunks WHERE kb_id = ?', [id]);

      await logActivity(req, 'Knowledge Base', 'kb_delete', id, { title: result[0].title });

      res.json({ success: true, msg: 'Entry deleted successfully.' });
    } catch (err) {
      console.error(err);
      res.json({ success: false, msg: 'Failed to delete entry' });
    }
  },
);

// SEARCH knowledge base content
router.get('/search', validateUserOrAgent, verifyPermission('kb.read'), async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.json({ success: true, data: [] });
    }

    const data = await query(
      `SELECT id, title, type, source_path, 
              SUBSTRING(content, 1, 300) as snippet, created_at, status
       FROM knowledge_base 
       WHERE uid = ? AND (LOWER(content) LIKE ? OR LOWER(title) LIKE ?)
       ORDER BY created_at DESC LIMIT 20`,
      [req.decode.uid, `%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`],
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'Failed to search knowledge base' });
  }
});

module.exports = router;
