// socket.js
const { Server } = require('socket.io');
const { processSocketEvent } = require('./helper/socket');
const env = require('./env');
const { createCorsOptions } = require('./utils/corsConfig');
const { subscribeInboxChanges } = require('./utils/channels/inboxNotifications');

// Module-level variable to store the io instance.
let ioInstance = null;

/**
 * Initialize the Socket.IO server and attach event handlers.
 * @param {http.Server} server - Your HTTP server instance.
 * @returns {Server} The initialized Socket.IO server instance.
 */
function initializeSocket(server) {
  // Create a new Socket.IO server with basic CORS settings.
  ioInstance = new Server(server, {
    cors: createCorsOptions(env.CORS_ORIGINS),
  });

  const stopInboxNotifications = subscribeInboxChanges(
    async ({ uid, chatId, assignmentChanged }) => {
      for (const connection of getConnectionsByUid(uid)) {
        if (
          assignmentChanged &&
          connection.agent &&
          connection.data?.selectedChat?.chat_id === chatId
        ) {
          try {
            const { query } = require('./database/dbpromise');
            const assigned = await query(
              'SELECT 1 FROM agent_chats WHERE uid = ? AND owner_uid = ? AND chat_id = ?',
              [connection.uid, uid, chatId],
            );
            if (!assigned.length) {
              connection.data.selectedChat = null;
              sendToSocketId(connection.id, { chatId }, 'chat_access_revoked');
            }
          } catch {
            continue;
          }
        }
        sendToSocketId(connection.id, {}, 'update_chat_list');
        if (connection.data?.selectedChat?.chat_id === chatId) {
          sendToSocketId(connection.id, {}, 'update_conversation');
        }
      }
    },
  );
  ioInstance.httpServer?.once('close', stopInboxNotifications);

  const { authenticateSocket } = require('./utils/socketAuth');
  ioInstance.use(async (socket, next) => {
    try {
      socket.connectionInfo = await authenticateSocket(socket);
      next();
    } catch {
      next(new Error('Authentication required or account unavailable'));
    }
  });
  ioInstance.on('connection', (socket) => {
    // Recheck account, expiration and permissions for every operation, not just login.
    socket.use(async (_packet, next) => {
      try {
        const current = await authenticateSocket(socket);
        if (
          JSON.stringify(current.permissions) !== JSON.stringify(socket.connectionInfo.permissions)
        )
          socket.emit('permissions_updated', { permissions: current.permissions });
        Object.assign(socket.connectionInfo, current);
        next();
      } catch {
        socket.emit('error', { msg: 'Session expired or access revoked. Please sign in again.' });
        socket.disconnect(true);
      }
    });
    console.log('New connection established:');
    console.dir({ socket: socket.connectionInfo.id });

    // Immediately send an acknowledgement containing connection info.
    socket.emit('connection_ack', {
      uid: socket.connectionInfo.uid,
      agent: socket.connectionInfo.agent,
      permissions: socket.connectionInfo.permissions,
    });

    // Listen for generic "message" events.
    socket.on('message', (message) => {
      // Log the message along with the connectionInfo from the socket.
      console.log(`Received message from ${socket.id}:`, message);
      console.log('Connection Info:', socket.connectionInfo);
    });

    // Listen for custom events from the client.
    // This will catch any event that is not specifically handled.
    socket.onAny((event) => {
      // Optionally, filter out events that you want to ignore.
      if (event !== 'connection_ack' && event !== 'message') {
        // console.log(`Received event "${event}" from ${socket.id}:`, ...args);
      }
    });

    // Process additional socket events (defined in a helper module).
    processSocketEvent({
      socket,
      connectionInfo: socket.connectionInfo,
      sendToSocketId,
      sendToUid,
      sendToAll,
      updateConnectionDataBySocketId,
      getConnectionsByUid,
    });

    // Handle disconnects.
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

/**
 * Send a message to all connected sockets with a matching uid.
 * @param {string} targetUid - The uid to match.
 * @param {*} data - The data to send.
 * @param {string} [eventName="message"] - The event name to emit.
 */
function sendToUid(targetUid, data, eventName = 'message') {
  if (!ioInstance) {
    console.error('Socket.IO instance is not initialized');
    return;
  }
  ioInstance.sockets.sockets.forEach((socket) => {
    if (socket.connectionInfo && socket.connectionInfo.uid === targetUid) {
      console.log(`Emitting ${eventName} to socket ${socket.id} for uid ${targetUid}`);
      socket.emit(eventName, data);
    }
  });
}

/**
 * Send a message to a specific socket by its id.
 * @param {string} socketId - The unique socket id.
 * @param {*} data - The data to send.
 * @param {string} [eventName="message"] - The event name to emit.
 */
function sendToSocketId(socketId, data, eventName = 'message') {
  if (!ioInstance) {
    console.error('Socket.IO instance is not initialized');
    return;
  }
  const targetSocket = ioInstance.sockets.sockets.get(socketId);
  if (targetSocket) {
    console.log(`Emitting ${eventName} to socket ${socketId}`);
    targetSocket.emit(eventName, data);
  } else {
    console.error(`Socket with id ${socketId} not found.`);
  }
}

/**
 * Send a message to all connected sockets.
 * @param {*} data - The data to send.
 * @param {string} [eventName="message"] - The event name to emit.
 */
function sendToAll(data, eventName = 'message') {
  if (!ioInstance) {
    console.error('Socket.IO instance is not initialized');
    return;
  }
  ioInstance.sockets.sockets.forEach((socket) => {
    console.log(`Emitting ${eventName} to socket ${socket.id}`);
    socket.emit(eventName, data);
  });
}

/**
 * Example: Send a "ring" event to all sockets with a matching uid.
 * @param {string} targetUid - The uid to match.
 * @param {*} data - The data to send (default: { ring: true }).
 * @param {string} [eventName="ring"] - The event name to emit.
 */
function sendRingToUid(targetUid, data = { ring: true }, eventName = 'ring') {
  if (!ioInstance) {
    console.error('Socket.IO instance is not initialized');
    return;
  }
  ioInstance.sockets.sockets.forEach((socket) => {
    if (socket.connectionInfo && socket.connectionInfo.uid === targetUid) {
      console.log(`Emitting ${eventName} to socket ${socket.id} for uid ${targetUid}`);
      socket.emit(eventName, data);
    }
  });
}

/**
 * Return an array of connection info objects for all sockets matching the given uid.
 * @param {string} targetUid - The uid to match.
 * @returns {Array} Array of connection info objects.
 */
function getConnectionsByUid(targetUid) {
  if (!ioInstance) {
    console.error('Socket.IO instance is not initialized');
    return [];
  }

  const connections = new Set(); // Using Set to avoid duplicate entries

  ioInstance.sockets.sockets.forEach((socket) => {
    const connectionInfo = socket.connectionInfo;

    if (connectionInfo) {
      const { uid, owner_uid } = connectionInfo;

      if (uid === targetUid || owner_uid === targetUid) {
        connections.add(connectionInfo); // Set will handle duplicates
      }
    }
  });

  return Array.from(connections); // Convert Set back to Array before returning
}

/**
 * Update the connectionInfo.data object for a specific socket by its id.
 * @param {string} socketId - The unique socket id.
 * @param {object} newData - The new data to merge into connectionInfo.data.
 * @returns {object|null} The updated connectionInfo.data, or null if the socket wasn't found.
 */
function updateConnectionDataBySocketId(socketId, newData) {
  if (!ioInstance) {
    console.error('Socket.IO instance is not initialized');
    return null;
  }
  const targetSocket = ioInstance.sockets.sockets.get(socketId);
  if (!targetSocket) {
    console.error(`Socket with id ${socketId} not found.`);
    return null;
  }
  // Merge newData into the existing connectionInfo.data.
  targetSocket.connectionInfo.data = {
    ...targetSocket.connectionInfo.data,
    ...newData,
  };
  // console.log(
  //   `Updated connection data for socket ${socketId}:`,
  //   targetSocket.connectionInfo.data
  // );
  return targetSocket.connectionInfo.data;
}

/**
 * Getter for the current Socket.IO instance.
 * @returns {Server} The Socket.IO server instance.
 */
function getSocketIo() {
  return ioInstance;
}

module.exports = {
  initializeSocket,
  sendToUid,
  sendToSocketId,
  sendToAll,
  getConnectionsByUid,
  getSocketIo,
  getIOInstance: getSocketIo,
  sendRingToUid,
  updateConnectionDataBySocketId,
};
