const path = require('path');

function validatePath(baseDir, relativePath) {
  try {
    const resolvedBase = path.resolve(baseDir);
    const resolvedTarget = path.resolve(baseDir, relativePath);

    if (!resolvedTarget.startsWith(resolvedBase)) {
      return null;
    }

    return resolvedTarget;
  } catch (err) {
    return null;
  }
}

module.exports = {
  validatePath,
};
