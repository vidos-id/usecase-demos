import { randomUUID } from "crypto";
import type { User } from "../types/user";

const users = new Map<string, User>();

export const createUser = (data: Omit<User, "id" | "createdAt">): User => {
	const user: User = {
		...data,
		id: randomUUID(),
		createdAt: new Date(),
	};
	users.set(user.id, user);
	return user;
};

export const getUserById = (id: string): User | undefined => {
	return users.get(id);
};

export const getUserByIdentifier = (identifier: string): User | undefined => {
	for (const user of users.values()) {
		if (user.identifier === identifier) {
			return user;
		}
	}
	return undefined;
};

export const listUsers = (): User[] => {
	return Array.from(users.values());
};

export const clearAllUsers = (): void => {
	users.clear();
};
