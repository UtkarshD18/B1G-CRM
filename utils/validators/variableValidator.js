module.exports = {
  validate(nodes, edges) {
    const errors = [];
    const warnings = [];

    const responseSavers = nodes.filter(n => n.type === 'Response Saver' || n.type === 'response-saver');
    const seenVariables = new Set();

    for (const n of responseSavers) {
      const d = n.data || {};
      const label = d.label || n.type || n.id;
      const targetVar = d.variableName || d.variable;

      if (!targetVar) {
        errors.push({
          nodeId: n.id,
          severity: 'error',
          message: `Response Saver Node "${label}" is missing a target variable name.`
        });
      } else {
        if (seenVariables.has(targetVar)) {
          warnings.push({
            nodeId: n.id,
            severity: 'warning',
            message: `Multiple nodes are saving data into the variable "${targetVar}". Verify if this overwrite is intended.`
          });
        }
        seenVariables.add(targetVar);
      }
    }

    // Check for open curly brace syntax errors in messages/prompts
    for (const n of nodes) {
      const d = n.data || {};
      const label = d.label || n.type || n.id;
      const textFields = [
        d.msgContent?.text?.body || '',
        d.msgContent?.image?.caption || '',
        d.msgContent?.document?.caption || '',
        d.promptInstruction || '',
        d.prompt || '',
        d.url || ''
      ];

      for (const text of textFields) {
        if (typeof text === 'string') {
          const openMatches = (text.match(/\{\{/g) || []).length;
          const closeMatches = (text.match(/\}\}/g) || []).length;
          if (openMatches !== closeMatches) {
            errors.push({
              nodeId: n.id,
              severity: 'error',
              message: `Node "${label}" contains mismatched placeholder braces: "${text}".`
            });
          }
        }
      }
    }

    return { errors, warnings };
  }
};
