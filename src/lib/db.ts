import "server-only";

import Database from "better-sqlite3";
import path from "node:path";

let database: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (database) {
    return database;
  }

  const databasePath = path.join(process.cwd(), "data", "metrics.db");

  database = new Database(databasePath, {
    readonly: true,
  });

  database.pragma("query_only = ON");

  console.log("METRICS database connection established.");

  return database;
}
