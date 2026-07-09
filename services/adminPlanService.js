const { query } = require('../database/dbpromise.js');
const billingHelper = require('../functions/helpers/billingHelper.js');

async function addPlan({
  title,
  short_description,
  allow_tag,
  allow_note,
  allow_chatbot,
  contact_limit,
  allow_api,
  is_trial,
  price,
  price_strike,
  plan_duration_in_days,
}) {
  if (!title || !short_description || !plan_duration_in_days) {
    return { success: false, msg: ' Please fill details' };
  }

  await query(
    `INSERT INTO plan (title, short_description, allow_tag, allow_note, allow_chatbot, 
            contact_limit, allow_api, is_trial, price, price_strike, plan_duration_in_days) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      title,
      short_description,
      allow_tag ? 1 : 0,
      allow_note ? 1 : 0,
      allow_chatbot ? 1 : 0,
      parseInt(contact_limit || 0),
      allow_api ? 1 : 0,
      is_trial ? 1 : 0,
      is_trial ? 0 : price,
      price_strike,
      parseInt(plan_duration_in_days || 1),
    ],
  );

  return { success: true, msg: 'Plan has been updated' };
}

async function getPlans() {
  const data = await query(`SELECT * FROM plan`, []);
  return { success: true, data };
}

async function deletePlan(id) {
  await query(`DELETE FROM plan WHERE id = ?`, [id]);
  return { success: true, msg: 'Plan was deleted' };
}

async function editPlan({
  id,
  title,
  short_description,
  allow_tag,
  allow_note,
  allow_chatbot,
  contact_limit,
  allow_api,
  is_trial,
  price,
  price_strike,
  plan_duration_in_days,
}) {
  if (!id || !title || !short_description || !plan_duration_in_days) {
    return { success: false, msg: 'Please fill details' };
  }

  await query(
    `UPDATE plan SET title = ?, short_description = ?, allow_tag = ?, allow_note = ?, allow_chatbot = ?,
            contact_limit = ?, allow_api = ?, is_trial = ?, price = ?, price_strike = ?, plan_duration_in_days = ? WHERE id = ?`,
    [
      title,
      short_description,
      allow_tag ? 1 : 0,
      allow_note ? 1 : 0,
      allow_chatbot ? 1 : 0,
      parseInt(contact_limit || 0),
      allow_api ? 1 : 0,
      is_trial ? 1 : 0,
      is_trial ? 0 : price || 0,
      price_strike || 0,
      parseInt(plan_duration_in_days || 1),
      id,
    ],
  );

  return { success: true, msg: 'Plan was updated' };
}

async function assignPlanToUser({ plan, uid }) {
  if (!plan || !uid) {
    return { success: false, msg: 'Invalid input provided' };
  }

  const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [plan?.id]);
  if (getPlan.length < 1) {
    return { success: false, msg: 'Invalid plan found' };
  }

  await billingHelper.updateUserPlan(getPlan[0], uid);

  return { success: true, msg: 'User plan was updated' };
}

module.exports = {
  addPlan,
  getPlans,
  deletePlan,
  editPlan,
  assignPlanToUser,
};
