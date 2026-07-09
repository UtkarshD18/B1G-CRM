const path = require('path');
const { query } = require('../database/dbpromise.js');
const randomstring = require('randomstring');
const { getFileExtension } = require('../functions/function.js');

const MEDIA_DIR = path.join(__dirname, '..', 'client', 'public', 'media');

// ─── Pages ───────────────────────────────────────────────────────────────────

async function addPage({ title, content, slug, file }) {
  if (!title || !content || !slug) {
    return { success: false, msg: 'Please fill all fields' };
  }

  if (!file) {
    return { success: false, msg: 'No image was selected' };
  }

  const reservedSlugs = ['contact-form', 'privacy-policy', 'terms-and-conditions'];
  if (reservedSlugs.includes(slug)) {
    return {
      success: false,
      msg: 'This slug is already used by system please use another slug.',
    };
  }

  const getPage = await query(`SELECT * FROM page WHERE slug = ?`, [slug]);
  if (getPage.length > 0) {
    return {
      success: false,
      msg: 'Thi slug was already used by another page.',
    };
  }

  const randomString = randomstring.generate();
  const filename = `${randomString}.${getFileExtension(file.name)}`;

  file.mv(path.join(MEDIA_DIR, filename), (err) => {
    if (err) {
      console.log(err);
    }
  });

  await query(`INSERT INTO page (slug, title, image, content) VALUES (?,?,?,?)`, [
    slug,
    title,
    filename,
    content,
  ]);

  return { success: true, msg: 'Page was added' };
}

async function getPages() {
  const data = await query(`SELECT * FROM page WHERE permanent = ?`, [0]);
  return { success: true, data };
}

async function deletePage(id) {
  await query(`DELETE FROM page WHERE id = ?`, [id]);
  return { success: true, msg: 'Page was deleted' };
}

async function getPageBySlug(slug) {
  const data = await query(`SELECT * FROM page WHERE slug = ?`, [slug]);
  if (data.length < 1) {
    return { success: true, data: {}, page: false };
  }
  return { success: true, data: data[0], page: true };
}

async function updateTerms({ title, content }) {
  const getPP = await query(`SELECT * FROM page WHERE slug = ?`, ['terms-and-conditions']);

  if (getPP.length > 0) {
    await query(`UPDATE page SET title = ?, content = ? WHERE slug = ?`, [
      title,
      content,
      'terms-and-conditions',
    ]);
  } else {
    await query(`INSERT INTO page (slug, title, content, permanent) VALUES (?,?,?,?)`, [
      'terms-and-conditions',
      title,
      content,
      1,
    ]);
  }

  return { success: true, msg: 'Page updated' };
}

async function updatePrivacyPolicy({ title, content }) {
  const getPP = await query(`SELECT * FROM page WHERE slug = ?`, ['privacy-policy']);

  if (getPP.length > 0) {
    await query(`UPDATE page SET title = ?, content = ? WHERE slug = ?`, [
      title,
      content,
      'privacy-policy',
    ]);
  } else {
    await query(`INSERT INTO page (slug, title, content, permanent) VALUES (?,?,?,?)`, [
      'privacy-policy',
      title,
      content,
      1,
    ]);
  }

  return { success: true, msg: 'Page updated' };
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

async function addFaq({ question, answer }) {
  if (!answer || !question) {
    return {
      success: false,
      msg: 'Please provide question and answer both',
    };
  }

  await query(`INSERT INTO faq (question, answer) VALUES (?,?)`, [question, answer]);

  return { success: true, msg: 'Faq was added' };
}

async function getFaqs() {
  const data = await query(`SELECT * FROM faq`, []);
  return { success: true, data };
}

async function deleteFaq(id) {
  await query(`DELETE FROM faq WHERE id = ?`, [id]);
  return { success: true, msg: 'Faq was deleted' };
}

// ─── Testimonials ────────────────────────────────────────────────────────────

async function addTestimonial({ title, description, reviewer_name, reviewer_position }) {
  if (!title || !description || !reviewer_name || !reviewer_position) {
    return { success: false, msg: 'Please fill all fields' };
  }

  await query(
    `INSERT INTO testimonial (title, description, reviewer_name, reviewer_position) VALUES (?,?,?,?)`,
    [title, description, reviewer_name, reviewer_position],
  );

  return { success: true, msg: 'Testimonial was added' };
}

async function getTestimonials() {
  const data = await query(`SELECT * FROM testimonial`, []);
  return { success: true, data };
}

async function deleteTestimonial(id) {
  await query(`DELETE FROM testimonial WHERE id = ?`, [id]);
  return { success: true, msg: 'Testimonial was deleted' };
}

// ─── Brands ──────────────────────────────────────────────────────────────────

async function addBrandImage(file) {
  if (!file) {
    return { success: false, msg: 'No files were uploaded' };
  }

  const randomString = randomstring.generate();
  const filename = `${randomString}.${getFileExtension(file.name)}`;

  file.mv(path.join(MEDIA_DIR, filename), (err) => {
    if (err) {
      console.log(err);
    }
  });

  await query(`INSERT INTO partners (filename) VALUES (?)`, [filename]);

  return { success: true, msg: 'Logo was uploaded' };
}

async function getBrands() {
  const data = await query(`SELECT * FROM partners`, []);
  return { success: true, data };
}

async function deleteBrand(id) {
  await query(`DELETE from partners WHERE id = ?`, [id]);
  return { success: true, msg: 'Bran was deleted' };
}

module.exports = {
  // Pages
  addPage,
  getPages,
  deletePage,
  getPageBySlug,
  updateTerms,
  updatePrivacyPolicy,
  // FAQ
  addFaq,
  getFaqs,
  deleteFaq,
  // Testimonials
  addTestimonial,
  getTestimonials,
  deleteTestimonial,
  // Brands
  addBrandImage,
  getBrands,
  deleteBrand,
};
