module.exports = {
  compare(n1, n2) {
    const changes = [];
    const d1 = n1.data || {};
    const d2 = n2.data || {};

    const fields = ['url', 'method', 'body', 'headers'];
    for (const f of fields) {
      const val1 = d1[f];
      const val2 = d2[f];

      if (f === 'headers') {
        const h1 = JSON.stringify(val1 || []);
        const h2 = JSON.stringify(val2 || []);
        if (h1 !== h2) {
          changes.push({
            field: 'headers',
            from: val1,
            to: val2
          });
        }
      } else if (val1 !== val2) {
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
