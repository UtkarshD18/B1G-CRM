const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool(
  connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST || process.env.DBHOST || "127.0.0.1",
        port: Number(process.env.PGPORT || process.env.DBPORT || 5432),
        user: process.env.PGUSER || process.env.DBUSER,
        password: process.env.PGPASSWORD || process.env.DBPASS,
        database: process.env.PGDATABASE || process.env.DBNAME,
      }
);

pool
  .query("SELECT 1")
  .then(() => {
    console.log("PostgreSQL database has been connected");
  })
  .catch((err) => {
    console.log({
      err,
      msg: "PostgreSQL database connected error",
    });
  });

module.exports = pool;
