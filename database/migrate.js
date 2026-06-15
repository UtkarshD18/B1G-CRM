const fs = require("fs");
const path = require("path");
const pool = require("./config");

const migrationsDir = path.join(__dirname, "migrations");

function stripPsqlCommands(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("\\"))
    .join("\n")
    .trim();
}

function logInfo(logger, message, meta = {}) {
  if (logger && typeof logger.info === "function") {
    logger.info(message, meta);
    return;
  }

  console.log(message, meta);
}

function logError(logger, message, meta = {}) {
  if (logger && typeof logger.error === "function") {
    logger.error(message, meta);
    return;
  }

  console.error(message, meta);
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function listMigrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => /^\d+.*\.sql$/i.test(file))
    .sort((a, b) => a.localeCompare(b));
}

async function runMigrations({ logger = console } = {}) {
  const files = listMigrationFiles();
  const client = await pool.connect();
  const appliedNow = [];
  let inTransaction = false;

  try {
    await ensureMigrationTable(client);

    const appliedResult = await client.query(
      "SELECT filename FROM schema_migrations"
    );
    const applied = new Set(appliedResult.rows.map((row) => row.filename));

    for (const file of files) {
      if (applied.has(file)) {
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = stripPsqlCommands(fs.readFileSync(filePath, "utf8"));

      logInfo(logger, "Applying database migration", { file });

      await client.query("BEGIN");
      inTransaction = true;

      if (sql) {
        await client.query(sql);
      }

      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file]
      );

      await client.query("COMMIT");
      inTransaction = false;
      appliedNow.push(file);
    }

    logInfo(logger, "Database migrations complete", {
      applied: appliedNow.length,
      total: files.length,
    });

    return { applied: appliedNow, total: files.length };
  } catch (err) {
    if (inTransaction) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        logError(logger, "Database migration rollback failed", {
          error: rollbackErr.message,
        });
      }
    }

    logError(logger, "Database migrations failed", { error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then((result) => {
      console.log("Migrations finished", result);
      return pool.end();
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { runMigrations };
