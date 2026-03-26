import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export function createUser(data: {
	id: string;
	username: string;
	passwordHash: string;
}) {
	const now = new Date().toISOString();
	return db
		.insert(users)
		.values({
			id: data.id,
			username: data.username,
			passwordHash: data.passwordHash,
			identityVerified: false,
			createdAt: now,
		})
		.returning()
		.get();
}

export function getUserByUsername(username: string) {
	return db.select().from(users).where(eq(users.username, username)).get();
}

export function getUserById(id: string) {
	return db.select().from(users).where(eq(users.id, id)).get();
}

export function updateUserIdentity(
	userId: string,
	claims: { givenName: string; familyName: string; birthDate: string },
) {
	return db
		.update(users)
		.set({
			identityVerified: true,
			givenName: claims.givenName,
			familyName: claims.familyName,
			birthDate: claims.birthDate,
		})
		.where(eq(users.id, userId))
		.returning()
		.get();
}
