const pool = require("./config");
const logger = require("../utils/logger");

/**
 * Execute database query with promise-based interface
 * @param {string} sql - SQL query string
 * @param {array} values - Query parameters
 * @returns {Promise}
 */
function query(sql, values = []) {
  return new Promise((resolve, reject) => {
    if (!sql) {
      return reject(new Error("SQL query is required"));
    }

    pool.query(sql, values, (error, results) => {
      if (error) {
        logger.error("Database Query Error:", { sql, error: error.message });
        return reject(error);
      }
      resolve(results);
    });
  });
}

/**
 * Execute multiple queries in a transaction
 * @param {array} queries - Array of {sql, values} objects
 * @returns {Promise}
 */
function transaction(queries) {
  return new Promise(async (resolve, reject) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const results = [];
      for (const { sql, values } of queries) {
        const result = await new Promise((res, rej) => {
          connection.query(sql, values, (err, data) => {
            if (err) rej(err);
            else res(data);
          });
        });
        results.push(result);
      }

      await connection.commit();
      resolve(results);
    } catch (error) {
      await connection.rollback();
      logger.error("Transaction Error:", error);
      reject(error);
    } finally {
      connection.release();
    }
  });
}

/**
 * Get a single row from database
 * @param {string} sql - SQL query string
 * @param {array} values - Query parameters
 * @returns {Promise}
 */
async function queryOne(sql, values = []) {
  try {
    const results = await query(sql, values);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Get count of rows matching query
 * @param {string} table - Table name
 * @param {object} where - WHERE clause conditions
 * @returns {Promise<number>}
 */
async function count(table, where = {}) {
  try {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    const values = [];
    const conditions = [];

    if (Object.keys(where).length > 0) {
      for (const [key, value] of Object.entries(where)) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    const result = await queryOne(sql, values);
    return result ? result.count : 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Insert a new record
 * @param {string} table - Table name
 * @param {object} data - Data to insert
 * @returns {Promise}
 */
async function insert(table, data) {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");

    const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Update records
 * @param {string} table - Table name
 * @param {object} data - Data to update
 * @param {object} where - WHERE conditions
 * @returns {Promise}
 */
async function update(table, data, where) {
  try {
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }

    const conditions = [];
    for (const [key, value] of Object.entries(where)) {
      conditions.push(`${key} = ?`);
      values.push(value);
    }

    const sql = `UPDATE ${table} SET ${updates.join(", ")} WHERE ${conditions.join(" AND ")}`;
    const result = await query(sql, values);
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete records
 * @param {string} table - Table name
 * @param {object} where - WHERE conditions
 * @returns {Promise}
 */
async function deleteRecord(table, where) {
  try {
    const conditions = [];
    const values = [];

    for (const [key, value] of Object.entries(where)) {
      conditions.push(`${key} = ?`);
      values.push(value);
    }

    const sql = `DELETE FROM ${table} WHERE ${conditions.join(" AND ")}`;
    const result = await query(sql, values);
    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  query,
  queryOne,
  transaction,
  count,
  insert,
  update,
  delete: deleteRecord,
};
