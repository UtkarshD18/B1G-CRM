require('dotenv').config();
const { startHealthMonitor } = require('../utils/channels/healthMonitor');

console.log("[Worker] Starting Channel Connections Health Monitor Worker...");
startHealthMonitor(60000); // Poll every minute
