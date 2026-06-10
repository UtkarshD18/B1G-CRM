const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool(
  connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST || "127.0.0.1",
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || "b1gcrm",
        password: process.env.PGPASSWORD || "",
        database: process.env.PGDATABASE || "b1gcrm",
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
