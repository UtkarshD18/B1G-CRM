const path = require('path');

function validatePath(baseDir, relativePath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(baseDir, relativePath);

  if (!resolvedTarget.startsWith(resolvedBase)) {
    throw new Error('Path traversal detected');
  }

  return resolvedTarget;
}

module.exports = {
  validatePath,
};
