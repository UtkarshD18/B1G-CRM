module.exports = {
  validate(nodes, edges) {
    const endNodes = nodes.filter(n => n.type === 'End Flow' || n.type === 'end-flow' || n.type === 'end');
    const errors = [];
    const warnings = [];

    if (endNodes.length === 0) {
      warnings.push({
        severity: 'warning',
        message: 'Flow has no End Flow terminal node. While not strictly blocked, it is recommended to terminate paths.'
      });
    }

    return { errors, warnings };
  }
};
