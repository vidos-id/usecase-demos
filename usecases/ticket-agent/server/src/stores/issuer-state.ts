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

export function upsertIssuerState(data: {
	trustMaterial: unknown;
	statusList?: unknown;
}) {
	const now = new Date().toISOString();

	return db
		.insert(issuerState)
		.values({
			id: DEFAULT_ISSUER_STATE_ID,
			trustMaterial: data.trustMaterial,
			statusList: data.statusList ?? null,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: issuerState.id,
			set: {
				trustMaterial: data.trustMaterial,
				statusList: data.statusList ?? null,
				updatedAt: now,
			},
		})
		.returning()
		.get();
}
