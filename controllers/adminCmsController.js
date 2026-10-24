const adminCmsService = require('../services/adminCmsService.js');

// ─── Pages ───────────────────────────────────────────────────────────────────

async function addPage(req, res, next) {
  try {
    const { title, content, slug } = req.body;
    const file = req.files?.file || null;
    const result = await adminCmsService.addPage({ title, content, slug, file });
    if (!result.success) {
      return res.json({ msg: result.msg, success: result.success });
    }
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function getPages(req, res, next) {
  try {
    const result = await adminCmsService.getPages();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function deletePage(req, res, next) {
  try {
    const { id } = req.body;
    const result = await adminCmsService.deletePage(id);
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function getPageBySlug(req, res, next) {
  try {
    const { slug } = req.body;
    const result = await adminCmsService.getPageBySlug(slug);
    if (!result.page) {
      return res.json({ data: {}, success: true, page: false });
    }
    return res.json({ data: result.data, success: true, page: true });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

async function updateTerms(req, res, next) {
  try {
    const { title, content } = req.body;
    const result = await adminCmsService.updateTerms({ title, content });
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

async function updatePrivacyPolicy(req, res, next) {
  try {
    const { title, content } = req.body;
    const result = await adminCmsService.updatePrivacyPolicy({ title, content });
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

async function addFaq(req, res, next) {
  try {
    const { question, answer } = req.body;
    const result = await adminCmsService.addFaq({ question, answer });
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function getFaqs(req, res, next) {
  try {
    const result = await adminCmsService.getFaqs();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function deleteFaq(req, res, next) {
  try {
    const { id } = req.body;
    const result = await adminCmsService.deleteFaq(id);
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

// ─── Testimonials ────────────────────────────────────────────────────────────

async function addTestimonial(req, res, next) {
  try {
    const result = await adminCmsService.addTestimonial(req.body);
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

async function getTestimonials(req, res, next) {
  try {
    const result = await adminCmsService.getTestimonials();
    return res.json({ success: true, data: result.data });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

async function deleteTestimonial(req, res, next) {
  try {
    const { id } = req.body;
    const result = await adminCmsService.deleteTestimonial(id);
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'server error', err });
  }
}

// ─── Brands ──────────────────────────────────────────────────────────────────

async function addBrandImage(req, res, next) {
  try {
    const file = req.files?.file || null;
    const result = await adminCmsService.addBrandImage(file);
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function getBrands(req, res, next) {
  try {
    const result = await adminCmsService.getBrands();
    return res.json({ data: result.data, success: true });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function deleteBrand(req, res, next) {
  try {
    const { id } = req.body;
    const result = await adminCmsService.deleteBrand(id);
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
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
