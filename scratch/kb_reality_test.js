const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { singleReplyAi } = require('../functions/ai');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: 'b1gcrm_local_dev',
    database: 'b1gcrm'
  });
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
};

(async () => {
  console.log("=== Knowledge Base Reality Test Started ===");
  const auditUid = "local-user-uid";
  const results = [];

  // Cleanup existing test KB entries
  await queryDb("DELETE FROM knowledge_base WHERE uid = $1 AND title LIKE 'Test KB %'", [auditUid]);

  const testDocuments = [
    {
      title: "Test KB PDF Document",
      type: "pdf",
      source_path: "file://test_pdf.pdf",
      content: "This is a document about the return policy of B1GCRM. All sales can be returned within 30 days of purchase for a full refund."
    },
    {
      title: "Test KB DOCX Document",
      type: "docx",
      source_path: "file://test_docx.docx",
      content: "This is a document about server installation. B1GCRM servers run on Docker containers mapping to port 3010 by default."
    },
    {
      title: "Test KB TXT Document",
      type: "txt",
      source_path: "file://test_txt.txt",
      content: "This is a document containing contact information. Our general customer support hotline is +1-800-B1G-CRM-NOW."
    },
    {
      title: "Test KB Website URL",
      type: "url",
      source_path: "https://b1gcrm.internal/shipping-info",
      content: "This website page describes shipping times. Standard shipping to North America takes 3-5 business days."
    }
  ];

  // 1. Upload & Store documents
  console.log("1. Simulating document uploads and database insertions...");
  for (const doc of testDocuments) {
    await queryDb(`
      INSERT INTO knowledge_base (uid, title, type, source_path, content)
      VALUES ($1, $2, $3, $4, $5)
    `, [auditUid, doc.title, doc.type, doc.source_path, doc.content]);
    
    // Verify persistence
    const saved = await queryDb("SELECT * FROM knowledge_base WHERE uid = $1 AND title = $2", [auditUid, doc.title]);
    console.log(`- Document saved: "${doc.title}". Length in DB: ${saved[0]?.content.length}`);
    results.push({
      step: `insert_${doc.type}`,
      document: doc.title,
      storedInDb: saved.length > 0,
      verifiedLength: saved[0]?.content.length
    });
  }

  // 2. Mock Meta Msg dispatch function to inspect sent output
  let dispatchedSavObj = null;
  const mockSendMetaMsg = async ({ savObj }) => {
    dispatchedSavObj = savObj;
  };

  // 3. Setup AI provider to OpenAI with mock token to test retrieval path
  await queryDb(`
    INSERT INTO tenant_ai_providers (uid, provider, api_key, model, temperature, enabled)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (uid, provider) DO UPDATE 
    SET enabled = 1
  `, [auditUid, "openai", "mock_openai_key", "gpt-4o-mini", 0.7, 1]);

  const chatbotFromMysq = {
    id: 999,
    title: "KB Audit Bot",
    flow: JSON.stringify({ flow_id: "kb-flow-1" }),
    origin: JSON.stringify({ code: "META" })
  };

  // 4. Run queries to test context retrieval
  console.log("2. Running test queries to verify context retrieval...");
  const queriesToTest = [
    { queryText: "What is your return policy?", expectedKeyword: "30 days" },
    { queryText: "What port does the server run on?", expectedKeyword: "3010" },
    { queryText: "How can I contact support?", expectedKeyword: "+1-800-B1G-CRM" },
    { queryText: "How long does standard shipping take?", expectedKeyword: "3-5 business days" }
  ];

  for (const q of queriesToTest) {
    dispatchedSavObj = null;
    await singleReplyAi({
      uid: auditUid,
      k: null,
      chatbotFromMysq,
      toName: "Test Customer",
      senderNumber: "9999999999",
      sendMetaMsg: mockSendMetaMsg,
      chatId: "kb-test-chat-id",
      nodes: [],
      edges: [],
      incomingMsg: q.queryText,
      destributeTaskFlow: null
    });

    const bodyText = dispatchedSavObj?.msgContext?.text?.body || "";
    const retrievedCorrectly = bodyText.toLowerCase().includes(q.expectedKeyword.toLowerCase());
    
    console.log(`- Query: "${q.queryText}"`);
    console.log(`  Response: "${bodyText}"`);
    console.log(`  Contains context snippet "${q.expectedKeyword}": ${retrievedCorrectly}`);

    results.push({
      step: "query_evaluation",
      query: q.queryText,
      response: bodyText,
      expectedKeyword: q.expectedKeyword,
      contextRetrieved: retrievedCorrectly
    });
  }

  // Cleanup
  await queryDb("DELETE FROM knowledge_base WHERE uid = $1 AND title LIKE 'Test KB %'", [auditUid]);

  const reportPath = "/home/shadow/projects/B1GCRM/verification_artifacts/db_reports/knowledge_base_reality_report.json";
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Saved Knowledge Base reality report to ${reportPath}`);
  console.log("=== Knowledge Base Reality Test Complete ===");
})();
