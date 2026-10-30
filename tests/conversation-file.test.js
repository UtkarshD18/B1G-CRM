const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { addObjectToFile } = require('../functions/helpers/fileHelper');

function runWriter(script, filePath, prefix) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', script, filePath, prefix], { cwd: process.cwd() });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(stderr || `writer exited ${code}`)));
  });
}

test('two processes append 200 unique messages without losing or corrupting any', async () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'scratch', 'conversation-test-'));
  const filePath = path.join(tempDir, 'synthetic.json');
  const helperPath = require.resolve('../functions/helpers/fileHelper');
  const script = `const { addObjectToFile } = require(${JSON.stringify(helperPath)});
    for (let i = 0; i < 100; i++) addObjectToFile({ metaChatId: process.argv[2] + i }, process.argv[1]);`;
  try {
    await Promise.all([runWriter(script, filePath, 'a'), runWriter(script, filePath, 'b')]);
    const messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(messages).toHaveLength(200);
    expect(new Set(messages.map((message) => message.metaChatId)).size).toBe(200);
    expect(fs.existsSync(`${filePath}.lock`)).toBe(false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('a replayed provider message is appended only once', () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'scratch', 'conversation-replay-'));
  const filePath = path.join(tempDir, 'synthetic.json');
  try {
    addObjectToFile({ metaChatId: 'same' }, filePath);
    addObjectToFile({ metaChatId: 'same' }, filePath);
    expect(JSON.parse(fs.readFileSync(filePath, 'utf8'))).toHaveLength(1);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
