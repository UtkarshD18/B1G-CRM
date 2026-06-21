const puppeteer = require('puppeteer');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = path.join(__dirname, '../verification_artifacts');
const VIDEOS_DIR = path.join(ARTIFACTS_DIR, 'videos');
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');
const REPORTS_DIR = path.join(ARTIFACTS_DIR, 'reports');

const dbClient = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'b1gcrm',
  password: 'b1gcrm_local_dev',
  database: 'b1gcrm'
});

async function main() {
    await dbClient.connect();

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const testFiles = fs.readdirSync(path.join(__dirname, 'tests')).filter(f => f.endsWith('.js')).sort();
    
    let allResults = [];
    
    const artifactsCtx = { VIDEOS_DIR, SCREENSHOTS_DIR };

    console.log(`Starting execution of ${testFiles.length} test modules...`);

    for (const file of testFiles) {
        console.log(`\n============================`);
        console.log(`Running module: ${file}`);
        console.log(`============================`);
        const mod = require(path.join(__dirname, 'tests', file));
        try {
            const results = await mod.runTest(browser, dbClient, artifactsCtx);
            if (Array.isArray(results)) {
                allResults.push(...results);
            } else {
                allResults.push(results);
            }
        } catch (e) {
            console.error(`Error in ${file}:`, e);
            allResults.push({
                section: `Module: ${file}`,
                status: 'FAIL',
                details: `Fatal execution error: ${e.message}`,
                dbState: null, screenshot: null, video: null
            });
        }
    }

    await browser.close();
    await dbClient.end();

    // Generate Report
    let md = '# CLIENT DEMO CERTIFICATION REPORT\n\n';
    md += `**Date:** ${new Date().toISOString()}\n\n`;

    for (const r of allResults) {
      md += `## ${r.section}\n`;
      md += `**Status:** ${r.status}\n\n`;
      md += `**Details:** ${r.details}\n\n`;
      if (r.dbState) md += `**DB State:** ${r.dbState}\n\n`;
      if (r.apiState) md += `**API Response:** ${r.apiState}\n\n`;
      if (r.screenshot) md += `**Screenshot:** [View Image](file://${r.screenshot})\n\n`;
      if (r.video) md += `**Video:** [Watch Recording](file://${r.video})\n\n`;
      md += '---\n\n';
    }

    fs.writeFileSync(path.join(REPORTS_DIR, 'CLIENT_DEMO_CERTIFICATION_REPORT.md'), md);
    console.log(`\nAudit complete. Report generated at ${path.join(REPORTS_DIR, 'CLIENT_DEMO_CERTIFICATION_REPORT.md')}`);
}

main().catch(console.error);
