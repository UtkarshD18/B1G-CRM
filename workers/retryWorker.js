require('dotenv').config();
const { startOutgoingQueueWorker } = require('../utils/channels/retryQueueWorker');

console.log("[Worker] Starting Channel Outgoing Retry Worker...");
startOutgoingQueueWorker(5000);
