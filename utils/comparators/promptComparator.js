module.exports = {
  compare(n1, n2) {
    const changes = [];
    const d1 = n1.data || {};
    const d2 = n2.data || {};

    const p1 = d1.promptInstruction || d1.prompt || d1.msgContent?.prompt || '';
    const p2 = d2.promptInstruction || d2.prompt || d2.msgContent?.prompt || '';

    if (p1 !== p2) {
      changes.push({
        field: 'prompt',
        from: p1,
        to: p2
      });
    }

    const sys1 = d1.systemPrompt || '';
    const sys2 = d2.systemPrompt || '';
    if (sys1 !== sys2) {
      changes.push({
        field: 'systemPrompt',
        from: sys1,
        to: sys2
      });
    }

    return changes.length > 0 ? changes : null;
  }
};
