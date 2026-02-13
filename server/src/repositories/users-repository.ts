import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { usersTable } from "../db/schema";
import { userSelectSchema } from "../db/zod/users";

export interface CreateUserInput {
identifier: string;
documentNumber?: string;
familyName: string;
givenName: string;
birthDate?: string;
nationality?: string;
email?: string;
address?: string;
portrait?: string;
}

export const usersRepository = {
create(input: CreateUserInput) {
const row = {
id: randomUUID(),
identifier: input.identifier,
documentNumber: input.documentNumber,
familyName: input.familyName,
givenName: input.givenName,
birthDate: input.birthDate,
nationality: input.nationality,
email: input.email,
address: input.address,
portrait: input.portrait,
createdAt: new Date().toISOString(),
};
db.insert(usersTable).values(row).run();
return userSelectSchema.parse(row);
},
	findById(id: string) {
		const row = db.select().from(usersTable).where(eq(usersTable.id, id)).get();
		return row ? userSelectSchema.parse(row) : undefined;
	},
	findByIdentifier(identifier: string) {
		const row = db
			.select()
			.from(usersTable)
			.where(eq(usersTable.identifier, identifier))
			.get();
		return row ? userSelectSchema.parse(row) : undefined;
	},
clearAll() {
db.delete(usersTable).run();
},
};
