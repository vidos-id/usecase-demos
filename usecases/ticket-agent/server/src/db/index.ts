import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { env } from "../env";
import * as schema from "./schema";

const dbDir = path.dirname(env.DATABASE_PATH);
if (dbDir !== ".") {
	const dbDirExists = await Bun.file(dbDir).exists();
	if (!dbDirExists) {
		await mkdir(dbDir, { recursive: true });
	}
}

const sqlite = new Database(env.DATABASE_PATH);
sqlite.run("PRAGMA foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

const migrationsFolder = path.join(import.meta.dir, "migrations");
migrate(db, { migrationsFolder });

console.info("[DB] Database initialized and migrations applied");
