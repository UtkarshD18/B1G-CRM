const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sleepArray = new Int32Array(new SharedArrayBuffer(4));

// Transitional protection for legacy JSON conversations. All writers that use
// this helper serialize across Node processes and publish complete files.
function updateConversationFile(filePath, update) {
  const parentDir = path.dirname(filePath);
  fs.mkdirSync(parentDir, { recursive: true });
  const lockPath = `${filePath}.lock`;
  const deadline = Date.now() + 30000;
  for (;;) {
    try {
      fs.mkdirSync(lockPath);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        if (Date.now() - fs.statSync(lockPath).mtimeMs > 60000) {
          fs.rmdirSync(lockPath);
          continue;
        }
      } catch (statError) {
        if (statError.code !== 'ENOENT' && statError.code !== 'ENOTEMPTY') throw statError;
      }
      if (Date.now() >= deadline) throw new Error('Conversation file is busy');
      Atomics.wait(sleepArray, 0, 0, 10);
    }
  }

  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    const current = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
    if (!Array.isArray(current)) throw new Error('Conversation file must contain an array');
    const next = update(current);
    if (!Array.isArray(next)) throw new Error('Conversation update must return an array');
    const fd = fs.openSync(temporaryPath, 'wx', 0o600);
    try {
      fs.writeFileSync(fd, JSON.stringify(next, null, 2));
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(temporaryPath, filePath);
    const directoryFd = fs.openSync(parentDir, 'r');
    try { fs.fsyncSync(directoryFd); } finally { fs.closeSync(directoryFd); }
    return next;
  } finally {
    try { fs.unlinkSync(temporaryPath); } catch (error) {
      if (error.code !== 'ENOENT') console.error('Could not remove temporary conversation file:', error);
    }
    try { fs.rmdirSync(lockPath); } catch (error) {
      if (error.code !== 'ENOENT') console.error('Could not release conversation lock:', error);
    }
  }
}

module.exports = { updateConversationFile };
