const fs = require('fs');
const path = require('path');

exports.runTest = async (browser, dbClient, artifactsCtx) => {
    const results = [];

    // ---------------------------------------------------------
    // Missing Contact Audit
    // ---------------------------------------------------------
    // Every conversation, chatbot log, campaign log, lead maps to a valid contact.
    // However, in B1GCRM, chats might just have customer_phone. But let's check.
    const chatsMissingContact = await dbClient.query(`
        SELECT c.id, c.sender_mobile 
        FROM chats c 
        LEFT JOIN contact co ON c.sender_mobile = co.mobile AND c.uid = co.uid 
        WHERE co.id IS NULL
    `);
    
    fs.writeFileSync(path.join(artifactsCtx.REPORTS_DIR, '../missing_contacts_report.json'), JSON.stringify(chatsMissingContact.rows, null, 2));

    const missingContactPass = chatsMissingContact.rows.length === 0;

    results.push({
        section: 'Missing Contact Audit',
        status: missingContactPass ? 'PASS' : 'FAIL',
        details: missingContactPass ? 'All chats map to contacts.' : `Found ${chatsMissingContact.rows.length} chats without contacts.`,
        dbState: `Missing Contacts: ${chatsMissingContact.rows.length}`,
        screenshot: null,
        video: null
    });

    // ---------------------------------------------------------
    // Orphan Data Audit
    // ---------------------------------------------------------
    // Every chat, contact, lead, task has valid ownership.
    const orphanTasks = await dbClient.query(`SELECT count(*) as c FROM agent_task WHERE uid NOT IN (SELECT uid FROM "user")`);
    const orphanChats = await dbClient.query(`SELECT count(*) as c FROM chats WHERE uid NOT IN (SELECT uid FROM "user")`);
    const orphanContacts = await dbClient.query(`SELECT count(*) as c FROM contact WHERE uid NOT IN (SELECT uid FROM "user")`);

    const orphans = {
        tasks: parseInt(orphanTasks.rows[0].c),
        chats: parseInt(orphanChats.rows[0].c),
        contacts: parseInt(orphanContacts.rows[0].c)
    };

    fs.writeFileSync(path.join(artifactsCtx.REPORTS_DIR, '../orphan_report.json'), JSON.stringify(orphans, null, 2));

    const orphanPass = orphans.tasks === 0 && orphans.chats === 0 && orphans.contacts === 0;

    results.push({
        section: 'Orphan Data Audit',
        status: orphanPass ? 'PASS' : 'FAIL',
        details: orphanPass ? 'No orphan data found.' : `Found orphan data: ${JSON.stringify(orphans)}`,
        dbState: `Orphans: Tasks=${orphans.tasks}, Chats=${orphans.chats}`,
        screenshot: null,
        video: null
    });

    return results;
};
