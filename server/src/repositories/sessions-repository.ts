import { randomUUID } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { db } from "../db/client";
import { sessionsTable } from "../db/schema";
import { sessionSelectSchema } from "../db/zod/sessions";

const DEFAULT_TTL_MS = 60 * 60 * 1000;

export const sessionsRepository = {
	create(userId: string, mode: "direct_post" | "dc_api", ttlMs = DEFAULT_TTL_MS) {
const now = new Date();
const row = {
id: randomUUID(),
userId,
mode,
status: "active" as const,
createdAt: now.toISOString(),
expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
};
db.insert(sessionsTable).values(row).run();
return sessionSelectSchema.parse(row);
	},
	findActiveById(id: string) {
		const row = db
			.select()
			.from(sessionsTable)
			.where(and(eq(sessionsTable.id, id), eq(sessionsTable.status, "active")))
			.get();
if (!row) return undefined;
if (row.expiresAt <= new Date().toISOString()) {
db.update(sessionsTable)
.set({ status: "expired" })
.where(eq(sessionsTable.id, id))
.run();
return undefined;
}
return sessionSelectSchema.parse(row);
},
expireStaleSessions() {
db.update(sessionsTable)
.set({ status: "expired" })
.where(
and(
eq(sessionsTable.status, "active"),
lt(sessionsTable.expiresAt, new Date().toISOString()),
),
)
.run();
},
revokeById(id: string) {
db.update(sessionsTable)
.set({ status: "revoked" })
.where(eq(sessionsTable.id, id))
.run();
},
clearAll() {
db.delete(sessionsTable).run();
},
};
