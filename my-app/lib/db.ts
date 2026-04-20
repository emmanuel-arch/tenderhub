import "server-only";
import sql, { ConnectionPool, config as SqlConfig } from "mssql";

declare global {
  // eslint-disable-next-line no-var
  var __tenderhubPool: Promise<ConnectionPool> | undefined;
}

function buildConfig(): SqlConfig {
  const server = process.env.DB_SERVER ?? "45.150.188.26";
  const port = Number(process.env.DB_PORT ?? "4420");
  const database = process.env.DB_NAME ?? "TenderHub";
  const user = process.env.DB_USER ?? "tester";
  const password = process.env.DB_PASSWORD ?? "";

  return {
    server,
    port,
    database,
    user,
    password,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
    options: {
      encrypt: (process.env.DB_ENCRYPT ?? "true") === "true",
      trustServerCertificate:
        (process.env.DB_TRUST_SERVER_CERT ?? "true") === "true",
      enableArithAbort: true,
    },
    connectionTimeout: 30_000,
    requestTimeout: 30_000,
  };
}

export async function getPool(): Promise<ConnectionPool> {
  if (!global.__tenderhubPool) {
    global.__tenderhubPool = new sql.ConnectionPool(buildConfig())
      .connect()
      .catch((err) => {
        global.__tenderhubPool = undefined;
        throw err;
      });
  }
  return global.__tenderhubPool;
}

export { sql };
