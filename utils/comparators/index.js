const promptComparator = require("./promptComparator");
const modelComparator = require("./modelComparator");
const webhookComparator = require("./webhookComparator");
const variableComparator = require("./variableComparator");
const edgeComparator = require("./edgeComparator");

function compareFlows(v1Json, v2Json) {
  const nodes1 = v1Json.nodes || [];
  const nodes2 = v2Json.nodes || [];
  const edges1 = v1Json.edges || [];
  const edges2 = v2Json.edges || [];

  const addedNodes = [];
  const removedNodes = [];
  const modifiedNodes = [];

  const map1 = new Map(nodes1.map(n => [n.id, n]));
  const map2 = new Map(nodes2.map(n => [n.id, n]));

  // Check for added & modified nodes
  for (const [id, n2] of map2.entries()) {
    const n1 = map1.get(id);
    if (!n1) {
      addedNodes.push({
        id: n2.id,
        type: n2.type,
        label: n2.data?.label || n2.type || n2.id
      });
    } else {
      const nodeChanges = [];

      // Run modular comparator plugins
      const pc = promptComparator.compare(n1, n2);
      if (pc) nodeChanges.push(...pc);

      const mc = modelComparator.compare(n1, n2);
      if (mc) nodeChanges.push(...mc);

      const wc = webhookComparator.compare(n1, n2);
      if (wc) nodeChanges.push(...wc);

      const vc = variableComparator.compare(n1, n2);
      if (vc) nodeChanges.push(...vc);

      // Check standard fields like label and type
      if (n1.type !== n2.type) {
        nodeChanges.push({ field: 'type', from: n1.type, to: n2.type });
      }
      if ((n1.data?.label || '') !== (n2.data?.label || '')) {
        nodeChanges.push({ field: 'label', from: n1.data?.label || '', to: n2.data?.label || '' });
      }

      if (nodeChanges.length > 0) {
        modifiedNodes.push({
          id,
          type: n2.type,
          label: n2.data?.label || n2.type || n2.id,
          changes: nodeChanges
        });
      }
    }
  }

  // Check for removed nodes
  for (const [id, n1] of map1.entries()) {
    if (!map2.has(id)) {
      removedNodes.push({
        id: n1.id,
        type: n1.type,
        label: n1.data?.label || n1.type || n1.id
      });
    }
  }

  // Compare edges
  const edgeDiff = edgeComparator.compare(edges1, edges2);

  return {
    addedNodes,
    removedNodes,
    modifiedNodes,
    edges: edgeDiff
  };
}

module.exports = {
  compareFlows
};
