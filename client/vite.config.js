import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Extraction block
try {
  const logPath = 'C:\\Users\\piyush songara\\.gemini\\antigravity-ide\\brain\\18caf85f-8f2c-47fd-8bbb-54c344b5c376\\.system_generated\\logs\\transcript.jsonl';
  let debugLog = `Log path exists: ${fs.existsSync(logPath)}\n`;
  if (fs.existsSync(logPath)) {
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    debugLog += `Total lines in log: ${lines.length}\n`;
    let count = 0;
    for (const line of lines) {
      if (line.includes('AutomationFlows.jsx')) {
        debugLog += `Found line with AutomationFlows.jsx\n`;
        try {
          const obj = JSON.parse(line);
          debugLog += `  Parsed JSON. Type: ${obj.type}, Status: ${obj.status}\n`;
          if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
              debugLog += `    Tool call: ${tc.name}\n`;
              if (tc.args && tc.args.TargetFile) {
                debugLog += `      Target file: ${tc.args.TargetFile}\n`;
                if (tc.args.TargetFile.endsWith('AutomationFlows.jsx')) {
                  if (tc.args.ReplacementContent) {
                    fs.writeFileSync(`c:\\Users\\piyush songara\\B1G-CRM\\client\\src\\pages\\user\\extracted_AF_${count}.jsx`, tc.args.ReplacementContent);
                    count++;
                    debugLog += `      -> Extracted ReplacementContent version ${count}\n`;
                  } else if (tc.args.CodeContent) {
                    fs.writeFileSync(`c:\\Users\\piyush songara\\B1G-CRM\\client\\src\\pages\\user\\extracted_AF_${count}.jsx`, tc.args.CodeContent);
                    count++;
                    debugLog += `      -> Extracted CodeContent version ${count}\n`;
                  }
                }
              }
            }
          }
        } catch (err) {
          debugLog += `  JSON Parse Error: ${err.message}\n`;
        }
      }
    }
  }
  fs.writeFileSync('c:\\Users\\piyush songara\\B1G-CRM\\client\\src\\pages\\user\\debug_extractor.txt', debugLog);
} catch (e) {
  fs.writeFileSync('c:\\Users\\piyush songara\\B1G-CRM\\client\\src\\pages\\user\\debug_extractor.txt', "Global error: " + e.stack);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3010',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'ws://localhost:3010',
        ws: true,
      },
    },
  },
})
