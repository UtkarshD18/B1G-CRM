require('dotenv').config();
require('../helper/inbox/inbox');
const { startIncomingQueueWorker } = require('../utils/channels/incomingQueueWorker');

console.log('[Worker] Starting Channel Incoming Queue Worker...');
startIncomingQueueWorker(3000);
