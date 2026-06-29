const { execSync } = require('child_process');

console.log('[EVIDENCE-HARNESS] Starting Dual Environment Validation Suite');

function run(script) {
  try {
    console.log(`\n[EVIDENCE-HARNESS] Executing ${script}...`);
    execSync(`node ${script}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`[EVIDENCE-HARNESS] Execution failed for ${script}`);
  }
}

// Since we discovered Docker workers crash (DEFECT-006) and Prod logs fail (DEFECT-007),
// the dual-environment validation will predictably fail in prod. We capture this.
run('scripts/evidence/verify-observability-evidence.js');

console.log('\n[EVIDENCE-HARNESS] Suite complete.');
