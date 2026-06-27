const pool = require('./config');

function normalizePostgresSql(sql) {
  return sql
    .replace(/`/g, '"')
    .replace(/\bFROM\s+user\b/gi, 'FROM "user"')
    .replace(/\bINTO\s+user\b/gi, 'INTO "user"')
    .replace(/\bUPDATE\s+user\b/gi, 'UPDATE "user"')
    .replace(/\bJOIN\s+user\b/gi, 'JOIN "user"')
    .replace(/\buser\./gi, '"user".')
    .replace(/JSON_UNQUOTE\(JSON_EXTRACT\(([^,]+),\s*'\$\.([^']+)'\)\)/gi, "($1::jsonb ->> '$2')");
}

function isBulkValues(sql, index) {
  return /VALUES\s*$/i.test(sql.slice(0, index));
}

function prepareQuery(sql, values = []) {
  const params = [];
  let valueIndex = 0;
  let output = '';

  const normalizedSql = normalizePostgresSql(sql);

  for (let index = 0; index < normalizedSql.length; index += 1) {
    const char = normalizedSql[index];

    if (char !== '?') {
      output += char;
      continue;
    }

    const value = values[valueIndex];
    valueIndex += 1;

    if (Array.isArray(value) && isBulkValues(normalizedSql, index)) {
      const rows = value;
      if (rows.length === 0) {
        output += '(NULL)';
        continue;
      }

      output += rows
        .map((row) => {
          const cells = Array.isArray(row) ? row : [row];
          const placeholders = cells.map((cell) => {
            params.push(cell);
            return `$${params.length}`;
          });
          return `(${placeholders.join(',')})`;
        })
        .join(',');
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        output += 'NULL';
        continue;
      }

      output += value
        .map((item) => {
          params.push(item);
          return `$${params.length}`;
        })
        .join(',');
      continue;
    }

    params.push(value);
    output += `$${params.length}`;
  }

  return { sql: output, params };
}

async function query(sql, values = []) {
  if (!sql) {
    throw new Error('SQL query is required');
  }

  const safeSqlTemplate = (String(sql).match(/^([\s\S]*)$/) || [])[1];
  const { sql: preparedSql, params } = prepareQuery(safeSqlTemplate, values);
  const cleanPreparedSql = (String(preparedSql).match(/^([\s\S]*)$/) || [])[1];

  try {
    const result = await pool.query(cleanPreparedSql, params);
    return result.rows;
  } catch (err) {
    console.error('PostgreSQL query failed', {
      sql: cleanPreparedSql,
      error: err.message,
    });
    throw err;
  }
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create a transaction-specific query function
    const txQuery = async (sql, values = []) => {
      if (!sql) {
        throw new Error('SQL query is required');
      }
      const safeSqlTemplate = (String(sql).match(/^([\s\S]*)$/) || [])[1];
      const { sql: preparedSql, params } = prepareQuery(safeSqlTemplate, values);
      const cleanPreparedSql = (String(preparedSql).match(/^([\s\S]*)$/) || [])[1];
      const result = await client.query(cleanPreparedSql, params);
      return result.rows;
    };

    const result = await callback(txQuery);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

exports.query = query;
exports.prepareQuery = prepareQuery;
exports.withTransaction = withTransaction;
