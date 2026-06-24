module.exports = {
  validate(nodes, edges) {
    const errors = [];
    const warnings = [];

    const aiNodes = nodes.filter(n => n.type === 'AI Transfer' || n.type === 'ai-transfer' || n.type === 'AI_BOT');
    
    for (const n of aiNodes) {
      const d = n.data || {};
      const label = d.label || n.type || n.id;
      const prompt = d.promptInstruction || d.prompt || d.msgContent?.prompt || '';

      if (!prompt.trim()) {
        errors.push({
          nodeId: n.id,
          severity: 'error',
          message: `AI Node "${label}" is missing prompt instruction guidelines.`
        });
      }

      const model = d.model || d.msgContent?.model || '';
      if (!model) {
        warnings.push({
          nodeId: n.id,
          severity: 'warning',
          message: `AI Node "${label}" has no model specified. System defaults will be used.`
        });
      }
    }

    return { errors, warnings };
  }
};
