const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

(async () => {
  const auditLogs = {};
  
  try {
    // 1. Authenticate to get JWT token
    console.log('Logging in as User...');
    const loginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: '<PASSWORD>'
    });
    
    const token = loginRes.data.token;
    if (!token) {
      throw new Error('Failed to login, token not returned');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Create local mock files to upload
    const mockDocPath = path.join(__dirname, 'audit-doc.txt');
    fs.writeFileSync(mockDocPath, 'Audit file upload text content');
    console.log('Mock document created.');

    // 3. Upload Document
    console.log('Uploading document...');
    const form = new FormData();
    form.append('file', fs.createReadStream(mockDocPath));

    const uploadRes = await axios.post('http://localhost:3010/api/user/return_media_url', form, {
      headers: {
        ...headers,
        ...form.getHeaders()
      }
    });

    console.log('Upload response:', uploadRes.data);
    auditLogs.upload = {
      success: uploadRes.data.success,
      url: uploadRes.data.url
    };

    if (uploadRes.data.success && uploadRes.data.url) {
      // 4. Verify static file reachability
      const fileUrl = uploadRes.data.url;
      // Change localhost to 127.0.0.1 for server-side axios request if needed, or query directly
      console.log(`Checking reachability of: ${fileUrl}`);
      const fileGetRes = await axios.get(fileUrl.replace('http://localhost:5173', 'http://localhost:3010'));
      console.log('Status of GET request on media URL:', fileGetRes.status);
      console.log('Returned content matches:', fileGetRes.data === 'Audit file upload text content');

      // 5. Verify local disk storage path
      const mediaDir = path.join(__dirname, 'client', 'public', 'media');
      const filename = path.basename(fileUrl);
      const filePathOnDisk = path.join(mediaDir, filename);
      const existsOnDisk = fs.existsSync(filePathOnDisk);
      console.log(`File exists on disk at ${filePathOnDisk}:`, existsOnDisk);

      auditLogs.verification = {
        reachabilityStatus: fileGetRes.status,
        contentMatches: fileGetRes.data === 'Audit file upload text content',
        diskStoragePath: filePathOnDisk,
        existsOnDisk
      };
    } else {
      auditLogs.verification = {
        error: "Upload did not return success or URL parameter."
      };
    }

    // Clean up local scratch mock doc
    if (fs.existsSync(mockDocPath)) {
      fs.unlinkSync(mockDocPath);
    }

  } catch (err) {
    console.error('Inbox e2e audit failed:', err.message);
    auditLogs.error = err.message;
  }

  console.log('\n=== Inbox E2E Audit Summary ===');
  console.log(JSON.stringify(auditLogs, null, 2));
  fs.writeFileSync('inbox_e2e_audit_report.json', JSON.stringify(auditLogs, null, 2));
})();
