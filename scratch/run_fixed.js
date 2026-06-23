const puppeteer = require('puppeteer');
const { Client } = require('pg');
const path = require('path');

const ARTIFACTS_DIR = path.join(__dirname, '../verification_artifacts');
const VIDEOS_DIR = path.join(ARTIFACTS_DIR, 'videos');
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');
const REPORTS_DIR = path.join(ARTIFACTS_DIR, 'reports');

const dbClient = new Client({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'b1gcrm',
  password: process.env.PGPASSWORD || 'CHANGE_ME',
  database: process.env.PGDATABASE || 'b1gcrm'
});

async function main() {
    await dbClient.connect();
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const artifactsCtx = { VIDEOS_DIR, SCREENSHOTS_DIR, REPORTS_DIR };

    const tests = ['03_chatbot_agent.js', '04_kanban_tasks.js', '07_db_audits.js'];
    for (const file of tests) {
        console.log(`Running: ${file}`);
        const mod = require(path.join(__dirname, 'tests', file));
        try {
            await mod.runTest(browser, dbClient, artifactsCtx);
        } catch (e) {
            console.error(`Error in ${file}:`, e);
        }
    }
    await browser.close();
    await dbClient.end();
}

main().catch(console.error);
