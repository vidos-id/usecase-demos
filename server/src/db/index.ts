import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { env } from "../env";
import * as schema from "./schema";

console.info("Initializing database connection", {
	databasePath: env.DATABASE_PATH,
});
const dbDir = path.dirname(env.DATABASE_PATH);
console.debug("Database directory", { dbDir });
if (dbDir !== ".") {
	const dbDirExists = await Bun.file(dbDir).exists();
	console.debug("Database directory exists check", {
		dbDir,
		exists: dbDirExists,
	});
	if (!dbDirExists) {
		console.info("Creating database directory", { dbDir });
		await mkdir(dbDir, { recursive: true });
		console.info("Database directory created successfully", { dbDir });
	}
}
console.info("Opening SQLite database", { databasePath: env.DATABASE_PATH });
const sqlite = new Database(env.DATABASE_PATH);
console.info("SQLite database opened successfully");
console.info("Enabling foreign keys", { pragma: "PRAGMA foreign_keys = ON" });
sqlite.run("PRAGMA foreign_keys = ON");
console.info("Foreign keys enabled");

export const db = drizzle(sqlite, { schema });
console.info("Drizzle ORM initialized with schema");

const migrationsFolder = path.join(import.meta.dir, "migrations");
console.info("Starting database migrations", { migrationsFolder });
migrate(db, { migrationsFolder });
console.info("Database migrations completed successfully");
