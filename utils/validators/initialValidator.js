module.exports = {
  validate(nodes, edges) {
    const triggerNodes = nodes.filter(n => n.type === 'initial' || n.type === 'TRIGGER');
    const errors = [];
    const warnings = [];

    if (triggerNodes.length === 0) {
      errors.push({
        severity: 'error',
        message: 'Flow is missing an Initial Trigger start node.'
      });
    } else if (triggerNodes.length > 1) {
      errors.push({
        severity: 'error',
        message: `Flow contains ${triggerNodes.length} Initial Trigger nodes. Only one is allowed.`
      });
    }

    return { errors, warnings };
  }
};
