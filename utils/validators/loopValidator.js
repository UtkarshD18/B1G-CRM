module.exports = {
  validate(nodes, edges) {
    const errors = [];
    const warnings = [];

    // Build adjacency list: node_id -> [target_node_ids]
    const adj = {};
    for (const n of nodes) {
      adj[n.id] = [];
    }
    for (const e of edges) {
      if (adj[e.source]) {
        adj[e.source].push(e.target);
      }
    }

    const visited = {};
    const recStack = {};
    const path = [];

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    function findCycle(u) {
      visited[u] = true;
      recStack[u] = true;
      path.push(u);

      const targets = adj[u] || [];
      for (const v of targets) {
        if (!visited[v]) {
          const cycleFound = findCycle(v);
          if (cycleFound) return true;
        } else if (recStack[v]) {
          // Cycle found. Extract the cycle path.
          const cycleStartIndex = path.indexOf(v);
          const cyclePath = path.slice(cycleStartIndex);
          
          // Check if cycle path contains a delay node
          let hasDelay = false;
          for (const nodeId of cyclePath) {
            const node = nodeMap.get(nodeId);
            if (node && (node.type === 'Delay' || node.type === 'delay')) {
              hasDelay = true;
              break;
            }
          }

          if (!hasDelay) {
            const labels = cyclePath.map(id => {
              const node = nodeMap.get(id);
              return node ? `"${node.data?.label || node.type || id}"` : id;
            });
            errors.push({
              severity: 'error',
              message: `Infinite circular loop detected without a Delay node: ${labels.join(' -> ')} -> ${labels[0]}.`
            });
            return true;
          }
        }
      }

      recStack[u] = false;
      path.pop();
      return false;
    }

    for (const n of nodes) {
      if (!visited[n.id]) {
        findCycle(n.id);
      }
    }

    return { errors, warnings };
  }
};
