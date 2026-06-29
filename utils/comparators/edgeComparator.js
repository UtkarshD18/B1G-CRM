module.exports = {
  compare(edges1, edges2) {
    const added = [];
    const removed = [];
    const modified = [];

    const map1 = new Map(edges1.map(e => [e.id, e]));
    const map2 = new Map(edges2.map(e => [e.id, e]));

    // Check for added/modified
    for (const [id, e2] of map2.entries()) {
      const e1 = map1.get(id);
      if (!e1) {
        added.push({
          id,
          source: e2.source,
          target: e2.target,
          sourceHandle: e2.sourceHandle,
          targetHandle: e2.targetHandle
        });
      } else if (
        e1.source !== e2.source ||
        e1.target !== e2.target ||
        e1.sourceHandle !== e2.sourceHandle ||
        e1.targetHandle !== e2.targetHandle
      ) {
        modified.push({
          id,
          from: { source: e1.source, target: e1.target, sourceHandle: e1.sourceHandle },
          to: { source: e2.source, target: e2.target, sourceHandle: e2.sourceHandle }
        });
      }
    }

    // Check for removed
    for (const [id, e1] of map1.entries()) {
      if (!map2.has(id)) {
        removed.push({
          id,
          source: e1.source,
          target: e1.target,
          sourceHandle: e1.sourceHandle,
          targetHandle: e1.targetHandle
        });
      }
    }

    return { added, removed, modified };
  }
};
