module.exports = {
  compare(n1, n2) {
    const changes = [];
    const d1 = n1.data || {};
    const d2 = n2.data || {};

    const fields = ['variableName', 'variable', 'key', 'value', 'labels', 'removeLabels', 'assignAi'];
    for (const f of fields) {
      const val1 = d1[f];
      const val2 = d2[f];

      if (Array.isArray(val1) || Array.isArray(val2)) {
        const j1 = JSON.stringify(val1 || []);
        const j2 = JSON.stringify(val2 || []);
        if (j1 !== j2) {
          changes.push({
            field: f,
            from: val1,
            to: val2
          });
        }
      } else if (val1 !== val2 && (val1 !== undefined || val2 !== undefined)) {
        changes.push({
          field: f,
          from: val1,
          to: val2
        });
      }
    }

    return changes.length > 0 ? changes : null;
  }
};
