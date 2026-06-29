const { execSync } = require('child_process');

async function cleanDB() {
  console.log('[CLEAN] Dropping all tables and re-running migrations...');
  try {
    execSync('npm run db:migrate', { stdio: 'inherit' });
    console.log('[CLEAN] Database schema reset successfully.');
  } catch (err) {
    console.error('Failed to clean database:', err);
    process.exit(1);
  }
}

cleanDB();
