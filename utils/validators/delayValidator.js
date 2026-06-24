module.exports = {
  validate(nodes, edges) {
    const errors = [];
    const warnings = [];

    const delayNodes = nodes.filter(n => n.type === 'Delay' || n.type === 'delay');

    for (const n of delayNodes) {
      const d = n.data || {};
      const label = d.label || n.type || n.id;
      const duration = d.duration !== undefined ? d.duration : d.msgContent?.duration;

      if (duration === undefined || duration === null || duration === '') {
        errors.push({
          nodeId: n.id,
          severity: 'error',
          message: `Delay Node "${label}" must specify a delay duration.`
        });
      } else {
        const num = Number(duration);
        if (isNaN(num) || num <= 0) {
          errors.push({
            nodeId: n.id,
            severity: 'error',
            message: `Delay Node "${label}" duration must be a positive number.`
          });
        }
      }
    }

    return { errors, warnings };
  }
};
