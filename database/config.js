const mysql = require("mysql2");
const env = require("../env");

/**
 * MySQL Connection Pool Configuration
 * Manages database connections with proper error handling
 */
const pool = mysql.createPool({
  connectionLimit: 100,
  waitForConnections: true,
  queueLimit: 0,
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: "utf8mb4",
  timezone: "+00:00",
  supportBigNumbers: true,
  bigNumberStrings: true,
  decimalNumbers: true,
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
      console.error("Database had a fatal error.");
    }
    if (err.code === "PROTOCOL_ENQUEUE_AFTER_CLOSE") {
      console.error("Database connection was forcibly closed.");
    }
    console.error("❌ Database Connection Error:", err.message);
    process.exit(1);
  } else {
    if (connection) {
      connection.release();
      console.log("✓ Database connection established successfully");
    }
  }
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("❌ Unexpected pool error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.error("Database connection was closed.");
  }
  if (err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
    console.error("Database had a fatal error.");
  }
  if (err.code === "PROTOCOL_ENQUEUE_AFTER_CLOSE") {
    console.error("Database connection was forcibly closed.");
  }
});

module.exports = pool;
