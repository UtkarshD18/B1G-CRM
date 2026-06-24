module.exports = {
  compare(n1, n2) {
    const changes = [];
    const d1 = n1.data || {};
    const d2 = n2.data || {};

    const fields = ['model', 'provider', 'temperature', 'jsonMode', 'assignAi'];
    for (const f of fields) {
      const val1 = d1[f] !== undefined ? d1[f] : d1.msgContent?.[f];
      const val2 = d2[f] !== undefined ? d2[f] : d2.msgContent?.[f];

      if (val1 !== val2 && (val1 !== undefined || val2 !== undefined)) {
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
