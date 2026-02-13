import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { authRequestsTable } from "../db/schema";
import { authRequestSelectSchema } from "../db/zod/auth-requests";

export type AuthRequestKind = "signup" | "signin" | "payment" | "loan";

const SHORT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_TTL_MS = 10 * 60 * 1000;

function ttlMsFor(kind: AuthRequestKind) {
return kind === "payment" || kind === "loan" ? SHORT_TTL_MS : DEFAULT_TTL_MS;
}

export const authRequestsRepository = {
create(input: {
externalAuthorizationId: string;
kind: AuthRequestKind;
mode: "direct_post" | "dc_api";
requestPayload?: Record<string, unknown>;
}) {
const row = {
id: randomUUID(),
externalAuthorizationId: input.externalAuthorizationId,
kind: input.kind,
mode: input.mode,
status: "pending" as const,
requestPayload: input.requestPayload
? JSON.stringify(input.requestPayload)
: null,
verifiedClaims: null,
errorMessage: null,
createdAt: new Date().toISOString(),
completedAt: null,
};
db.insert(authRequestsTable).values(row).run();
return authRequestSelectSchema.parse(row);
},
	findById(id: string) {
		const row = db
			.select()
			.from(authRequestsTable)
			.where(eq(authRequestsTable.id, id))
			.get();
if (!row) return undefined;
const createdAt = new Date(row.createdAt).getTime();
if (row.status === "pending" && Date.now() - createdAt > ttlMsFor(row.kind)) {
db.update(authRequestsTable)
.set({ status: "expired", completedAt: new Date().toISOString() })
.where(eq(authRequestsTable.id, row.id))
.run();
return undefined;
}
return authRequestSelectSchema.parse(row);
},
updateStatus(
id: string,
status: "pending" | "authorized" | "failed" | "expired",
options?: { verifiedClaims?: Record<string, unknown>; errorMessage?: string },
) {
db.update(authRequestsTable)
.set({
status,
completedAt: status === "pending" ? null : new Date().toISOString(),
verifiedClaims: options?.verifiedClaims
? JSON.stringify(options.verifiedClaims)
: null,
errorMessage: options?.errorMessage ?? null,
})
.where(eq(authRequestsTable.id, id))
.run();
},
deleteById(id: string) {
db.delete(authRequestsTable).where(eq(authRequestsTable.id, id)).run();
},
clearAll() {
db.delete(authRequestsTable).run();
},
};
