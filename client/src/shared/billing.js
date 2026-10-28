import { parseStoredJson } from './format';

function toTimestamp(value) {
  if (!value) return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return Math.abs(numeric) < 1e12 ? numeric * 1000 : numeric;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isTrialAvailable(user, plans = [], now = Date.now()) {
  if (!user || Number(user.trial || 0) > 0) return false;

  const currentPlan = parseStoredJson(user.plan, {}) || {};
  const savedTitle =
    currentPlan.title ||
    (typeof user.plan === 'string' && !user.plan.trim().startsWith('{') ? user.plan : '');
  const catalogPlan = plans.find(
    (plan) =>
      (currentPlan.id != null && String(plan.id) === String(currentPlan.id)) ||
      (savedTitle &&
        String(plan.title || '')
          .trim()
          .toLowerCase() === String(savedTitle).trim().toLowerCase()),
  );
  const expiresAt = toTimestamp(user.plan_expire);
  const price = Number(currentPlan.price ?? catalogPlan?.price ?? 0);
  const isTrialPlan = Number(currentPlan.is_trial ?? catalogPlan?.is_trial ?? 0) > 0;
  const paidPlanIsActive = expiresAt > now && price > 0 && !isTrialPlan;

  return !paidPlanIsActive;
}

export function getTrialUnavailableReason(user, plans = []) {
  if (!user) return 'Checking trial eligibility…';
  if (Number(user?.trial || 0) > 0) return 'This account has already used its free trial.';
  return isTrialAvailable(user, plans)
    ? ''
    : 'A free trial is unavailable while a paid subscription is active.';
}
