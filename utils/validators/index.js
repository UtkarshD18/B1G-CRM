const initialValidator = require("./initialValidator");
const endValidator = require("./endValidator");
const aiValidator = require("./aiValidator");
const delayValidator = require("./delayValidator");
const variableValidator = require("./variableValidator");
const loopValidator = require("./loopValidator");

function validateFlow(vJson) {
  const nodes = vJson.nodes || [];
  const edges = vJson.edges || [];

  const errors = [];
  const warnings = [];

  // 1. Run validation plugins
  const initialResult = initialValidator.validate(nodes, edges);
  errors.push(...initialResult.errors);
  warnings.push(...initialResult.warnings);

  const endResult = endValidator.validate(nodes, edges);
  errors.push(...endResult.errors);
  warnings.push(...endResult.warnings);

  const aiResult = aiValidator.validate(nodes, edges);
  errors.push(...aiResult.errors);
  warnings.push(...aiResult.warnings);

  const delayResult = delayValidator.validate(nodes, edges);
  errors.push(...delayResult.errors);
  warnings.push(...delayResult.warnings);

  const variableResult = variableValidator.validate(nodes, edges);
  errors.push(...variableResult.errors);
  warnings.push(...variableResult.warnings);

  const loopResult = loopValidator.validate(nodes, edges);
  errors.push(...loopResult.errors);
  warnings.push(...loopResult.warnings);

  // 2. Generic structural checks: Disconnected nodes & Dead ends
  const sourceIds = new Set(edges.map(e => e.source));
  const targetIds = new Set(edges.map(e => e.target));

  for (const n of nodes) {
    const label = n.data?.label || n.type || n.id;
    const isInitial = n.type === 'initial' || n.type === 'TRIGGER';
    const isEnd = n.type === 'End Flow' || n.type === 'end-flow' || n.type === 'end';

    // Disconnected
    if (!sourceIds.has(n.id) && !targetIds.has(n.id) && !isInitial) {
      warnings.push({
        nodeId: n.id,
        severity: 'warning',
        message: `Node "${label}" is completely disconnected from the flow.`
      });
    }

    // Dead end
    if (targetIds.has(n.id) && !sourceIds.has(n.id) && !isEnd) {
      warnings.push({
        nodeId: n.id,
        severity: 'warning',
        message: `Node "${label}" is a dead end with no outgoing connections.`
      });
    }
  }

  // 3. Health Score calculation
  let healthScore = 100 - (10 * warnings.length) - (25 * errors.length);
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    success: errors.length === 0,
    healthScore,
    errors,
    warnings
  };
}

module.exports = {
  validateFlow
};
