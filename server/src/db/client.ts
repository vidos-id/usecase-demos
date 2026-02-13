import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { env } from "../env";
import * as schema from "./schema";

const sqlite = new Database(env.VIDOS_SQLITE_PATH, { create: true, strict: true });
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });

const migrationsFolder = resolve(
dirname(fileURLToPath(import.meta.url)),
"../../drizzle",
);

export function runMigrations() {
migrate(db, { migrationsFolder });
}
