require("dotenv").config();

const { Pool } = require("pg");
const env = require("../env");

const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
    }
  : {
      host: env.PGHOST,
      port: env.PGPORT,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      database: env.PGDATABASE,
    };

if (env.PGSSL) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

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
