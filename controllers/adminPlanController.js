const adminPlanService = require('../services/adminPlanService.js');

async function addPlan(req, res, next) {
  try {
    const result = await adminPlanService.addPlan(req.body);
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function getPlans(req, res, next) {
  try {
    const result = await adminPlanService.getPlans();
    return res.json({ success: true, data: result.data });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function deletePlan(req, res, next) {
  try {
    const { id } = req.body;
    const result = await adminPlanService.deletePlan(id);
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function editPlan(req, res, next) {
  try {
    const result = await adminPlanService.editPlan(req.body);
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

async function assignPlanToUser(req, res, next) {
  try {
    const { plan, uid } = req.body;
    const result = await adminPlanService.assignPlanToUser({ plan, uid });
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({ success: true, msg: result.msg });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong' });
  }
}

module.exports = {
  addPlan,
  getPlans,
  deletePlan,
  editPlan,
  assignPlanToUser,
};
