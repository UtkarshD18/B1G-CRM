const router = require('express').Router();
const adminValidator = require('../middlewares/admin.js');
const adminAuthController = require('../controllers/adminAuthController.js');
const adminUserController = require('../controllers/adminUserController.js');
const adminPlanController = require('../controllers/adminPlanController.js');
const adminCmsController = require('../controllers/adminCmsController.js');
const adminSettingsController = require('../controllers/adminSettingsController.js');

router.post('/login', adminAuthController.login);

// add new plan
router.post('/add_plan', adminValidator, adminPlanController.addPlan);

// get plans
router.get('/get_plans', adminPlanController.getPlans);

// get web public
router.get('/get_web_public', adminSettingsController.getWebPublic);

// del plan
router.post('/del_plan', adminValidator, adminPlanController.deletePlan);

// edit plan
router.post('/edit_plan', adminValidator, adminPlanController.editPlan);

// get all users
router.get('/get_users', adminValidator, adminUserController.getUsers);

// update user
router.post('/update_user', adminValidator, adminUserController.updateUser);

// update plan (assign plan to user — owned by plan domain)
router.post('/update_plan', adminValidator, adminPlanController.assignPlanToUser);

// get payment gateway admin
router.get('/get_payment_gateway_admin', adminValidator, adminSettingsController.getPaymentGateway);

// update payment gateway
router.post('/update_pay_gateway', adminValidator, adminSettingsController.updatePaymentGateway);

// add partners logo
router.post('/add_brand_image', adminValidator, adminCmsController.addBrandImage);

// get all brands
router.get('/get_brands', adminCmsController.getBrands);

// del image
router.post('/del_brand_logo', adminValidator, adminCmsController.deleteBrand);

// add faq
router.post('/add_faq', adminValidator, adminCmsController.addFaq);

// get all faq
router.get('/get_faq', adminCmsController.getFaqs);

// del faq
router.post('/del_faq', adminValidator, adminCmsController.deleteFaq);

// add page
router.post('/add_page', adminValidator, adminCmsController.addPage);

// get all pages
router.get('/get_pages', adminCmsController.getPages);

// del page
router.post('/del_page', adminValidator, adminCmsController.deletePage);

// auto user login
router.post('/auto_login', adminValidator, adminUserController.autoLogin);

// ading testtimonial
router.post('/add_testimonial', adminValidator, adminCmsController.addTestimonial);

// get all testi
router.get('/get_testi', adminCmsController.getTestimonials);

// del testi
router.post('/del_testi', adminValidator, adminCmsController.deleteTestimonial);

// get orders
router.get('/get_orders', adminValidator, adminUserController.getOrders);

// get all contact forms
router.get('/get_contact_leads', adminValidator, adminUserController.getContactLeads);

// del contact entry
router.post('/del_cotact_entry', adminValidator, adminUserController.deleteContactEntry);

// get page by slug
router.post('/get_page_slug', adminCmsController.getPageBySlug);

// update termns
router.post('/update_terms', adminValidator, adminCmsController.updateTerms);

// update privacy policy
router.post('/update_privacy_policy', adminValidator, adminCmsController.updatePrivacyPolicy);

// get smtp
router.get('/get_smtp', adminValidator, adminSettingsController.getSmtp);

// update smtp
router.post('/update_smtp', adminValidator, adminSettingsController.updateSmtp);

// send test email
router.post('/send_test_email', adminValidator, adminSettingsController.sendTestEmail);

// get dashboard user
router.get('/get_dashboard_for_user', adminValidator, adminUserController.getDashboardForUser);

// get admin
router.get('/get_admin', adminValidator, adminAuthController.getAdmin);

// update admin
router.post('/update-admin', adminValidator, adminAuthController.updateAdmin);

// send recover
router.post('/send_resovery', adminAuthController.sendRecovery);

// modify recpvery passwrod
router.get('/modify_password', adminValidator, adminAuthController.modifyPassword);

// Duplicate del_user route removed to avoid conflicts.

// get all genn wa links
router.get('/get_wa_gen', adminValidator, adminSettingsController.getWaGenLinks);

// del gen link
router.post('/de_wa_den_link', adminValidator, adminSettingsController.deleteWaGenLink);

// get social login
router.get('/get_social_login', adminSettingsController.getSocialLogin);

// update social things
router.post('/update_social_login', adminValidator, adminSettingsController.updateSocialLogin);

// update rtl
router.post('/update_rtl', adminValidator, adminSettingsController.updateRtl);

// delete user
router.post('/del_user', adminValidator, adminUserController.deleteUser);

// update deployment settings
router.post(
  '/update_deployment_settings',
  adminValidator,
  adminSettingsController.updateDeploymentSettings,
);

// get transport metrics
router.get('/get_transport_metrics', adminValidator, adminSettingsController.getTransportMetrics);

module.exports = router;
