import type { ProfileUpdateClaims } from "shared/types/profile-update";
import type { User } from "../stores/users";

export function buildProfileUpdate(
	claims: ProfileUpdateClaims,
	requestedClaims: string[],
): { updates: Partial<User>; updatedFields: string[] } {
	const updates: Partial<User> = {};
	const updatedFields: string[] = [];
	const requested = new Set(requestedClaims);

	if (requested.has("family_name") && claims.family_name) {
		updates.familyName = claims.family_name;
		updatedFields.push("familyName");
	}

	if (requested.has("given_name") && claims.given_name) {
		updates.givenName = claims.given_name;
		updatedFields.push("givenName");
	}

	if (requested.has("birth_date") && claims.birthdate) {
		updates.birthDate = claims.birthdate;
		updatedFields.push("birthDate");
	}

	if (requested.has("nationality") && claims.nationalities?.length) {
		updates.nationality = claims.nationalities.join(", ");
		updatedFields.push("nationality");
	}

	if (requested.has("email_address") && claims.email) {
		updates.email = claims.email;
		updatedFields.push("email");
	}

	if (requested.has("portrait") && claims.picture) {
		updates.portrait = claims.picture;
		updatedFields.push("portrait");
	}

	if (requested.has("resident_address") && claims.resident_address) {
		updates.address = claims.resident_address;
		updatedFields.push("address");
	}

	return { updates, updatedFields };
}
