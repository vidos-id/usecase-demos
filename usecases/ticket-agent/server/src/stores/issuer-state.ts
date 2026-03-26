import { eq } from "drizzle-orm";
import { db } from "../db";
import { issuerState } from "../db/schema";

const DEFAULT_ISSUER_STATE_ID = "default";

export function getIssuerStateRecord() {
	return db
		.select()
		.from(issuerState)
		.where(eq(issuerState.id, DEFAULT_ISSUER_STATE_ID))
		.get();
}

export function upsertIssuerState(trustMaterial: unknown) {
	const now = new Date().toISOString();

	return db
		.insert(issuerState)
		.values({
			id: DEFAULT_ISSUER_STATE_ID,
			trustMaterial,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: issuerState.id,
			set: {
				trustMaterial,
				updatedAt: now,
			},
		})
		.returning()
		.get();
}
