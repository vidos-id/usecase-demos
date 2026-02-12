import { randomUUID } from "crypto";
import type { ActivityItem, User } from "../types/user";

const users = new Map<string, User>();

const SEED_TRANSACTIONS = [
	{ title: "Salary Deposit", amount: 3500.0 },
	{ title: "Supermart Groceries", amount: -87.45 },
	{ title: "Coffee Corner", amount: -4.8 },
	{ title: "Electric Bill", amount: -124.0 },
	{ title: "Streaming Service", amount: -12.99 },
	{ title: "Public Transit", amount: -45.0 },
	{ title: "Restaurant Dinner", amount: -62.3 },
	{ title: "Pharmacy", amount: -23.5 },
	{ title: "Bonus Payment", amount: 500.0 },
	{ title: "Gas Station", amount: -55.0 },
];

function generateSeededActivity(): {
	activity: ActivityItem[];
	balance: number;
} {
	const baseBalance = 12450.0;
	const count = Math.floor(Math.random() * 4) + 3; // 3-6 items
	const shuffled = [...SEED_TRANSACTIONS].sort(() => Math.random() - 0.5);
	const selected = shuffled.slice(0, count);

	let balance = baseBalance;
	const now = Date.now();
	const dayMs = 24 * 60 * 60 * 1000;

	const activity: ActivityItem[] = selected.map((tx, i) => {
		balance += tx.amount; // Apply to balance
		return {
			id: randomUUID(),
			type: "payment" as const,
			title: tx.title,
			amount: tx.amount,
			createdAt: new Date(now - (i + 1) * dayMs).toISOString(),
		};
	});

	// Already sorted by createdAt desc (newest first due to (i+1)*dayMs)
	return { activity, balance };
}

export const createUser = (
	data: Omit<
		User,
		"id" | "createdAt" | "balance" | "pendingLoansTotal" | "activity"
	>,
): User => {
	const { activity, balance } = generateSeededActivity();
	const user: User = {
		...data,
		id: randomUUID(),
		balance,
		pendingLoansTotal: 0,
		activity,
		createdAt: new Date(),
	};
	users.set(user.id, user);
	return user;
};

export const getUserById = (id: string): User | undefined => {
	return users.get(id);
};

export const updateUser = (
	id: string,
	updates: Partial<User>,
): User | undefined => {
	const user = users.get(id);
	if (!user) return undefined;
	const updated = { ...user, ...updates };
	users.set(id, updated);
	return updated;
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
