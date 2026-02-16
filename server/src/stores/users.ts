import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import {
	type ActivityItem,
	activityItemsSchema,
	users as usersTable,
} from "../db/schema";

export interface User {
	id: string;
	identifier: string;
	documentNumber?: string;
	familyName: string;
	givenName: string;
	birthDate: string;
	nationality: string;
	email?: string;
	address?: string;
	portrait?: string;
	balance: number;
	pendingLoansTotal: number;
	activity: ActivityItem[];
	createdAt: Date;
}

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

export const dollarsToCents = (dollars: number): number => {
	return Math.round(dollars * 100);
};

export const centsToDollars = (cents: number): number => {
	return cents / 100;
};

const parseActivity = (raw: unknown): ActivityItem[] => {
	if (raw === null || raw === undefined) {
		return [];
	}
	if (typeof raw === "string") {
		return activityItemsSchema.parse(JSON.parse(raw));
	}
	return activityItemsSchema.parse(raw);
};

const mapRowToUser = (row: typeof usersTable.$inferSelect): User => {
	return {
		id: row.id,
		identifier: row.identifier,
		documentNumber: row.documentNumber ?? undefined,
		familyName: row.familyName,
		givenName: row.givenName,
		birthDate: row.birthDate,
		nationality: row.nationality,
		email: row.email ?? undefined,
		address: row.address ?? undefined,
		portrait: row.portrait ?? undefined,
		balance: centsToDollars(row.balanceCents),
		pendingLoansTotal: centsToDollars(row.pendingLoansTotalCents),
		activity: parseActivity(row.activity),
		createdAt: new Date(row.createdAt),
	};
};

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
	const id = randomUUID();
	const createdAt = new Date();

	const row = {
		id,
		identifier: data.identifier,
		documentNumber: data.documentNumber ?? null,
		familyName: data.familyName,
		givenName: data.givenName,
		birthDate: data.birthDate,
		nationality: data.nationality,
		email: data.email ?? null,
		address: data.address ?? null,
		portrait: data.portrait ?? null,
		balanceCents: dollarsToCents(balance),
		pendingLoansTotalCents: 0,
		activity: JSON.stringify(activity) as unknown as ActivityItem[],
		createdAt: createdAt.toISOString(),
	};

	db.insert(usersTable).values(row).run();

	return {
		...data,
		id,
		balance,
		pendingLoansTotal: 0,
		activity,
		createdAt,
	};
};

export const getUserById = (id: string): User | undefined => {
	const row = db.select().from(usersTable).where(eq(usersTable.id, id)).get();
	if (!row) return undefined;
	return mapRowToUser(row);
};

const mergeActivity = (
	current: ActivityItem[],
	incoming: ActivityItem[],
): ActivityItem[] => {
	if (incoming.length === 0) return current;
	const currentIds = new Set(current.map((item) => item.id));
	const newItems = incoming.filter((item) => !currentIds.has(item.id));
	if (newItems.length === 0) return current;
	return [...newItems, ...current];
};

export const updateUser = (
	id: string,
	updates: Partial<User>,
): User | undefined => {
	return db.transaction((tx) => {
		const currentRow = tx
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, id))
			.get();
		if (!currentRow) return undefined;

		const updateData: Partial<typeof usersTable.$inferInsert> = {};

		if (updates.identifier !== undefined) {
			updateData.identifier = updates.identifier;
		}
		if (updates.documentNumber !== undefined) {
			updateData.documentNumber = updates.documentNumber ?? null;
		}
		if (updates.familyName !== undefined) {
			updateData.familyName = updates.familyName;
		}
		if (updates.givenName !== undefined) {
			updateData.givenName = updates.givenName;
		}
		if (updates.birthDate !== undefined) {
			updateData.birthDate = updates.birthDate;
		}
		if (updates.nationality !== undefined) {
			updateData.nationality = updates.nationality;
		}
		if (updates.email !== undefined) {
			updateData.email = updates.email ?? null;
		}
		if (updates.address !== undefined) {
			updateData.address = updates.address ?? null;
		}
		if (updates.portrait !== undefined) {
			updateData.portrait = updates.portrait ?? null;
		}
		if (updates.balance !== undefined) {
			updateData.balanceCents = dollarsToCents(updates.balance);
		}
		if (updates.pendingLoansTotal !== undefined) {
			updateData.pendingLoansTotalCents = dollarsToCents(
				updates.pendingLoansTotal,
			);
		}
		if (updates.createdAt !== undefined) {
			updateData.createdAt = updates.createdAt.toISOString();
		}

		if (updates.activity !== undefined) {
			const currentActivity = parseActivity(currentRow.activity);
			const updatedActivity = mergeActivity(currentActivity, updates.activity);
			updateData.activity = JSON.stringify(
				updatedActivity,
			) as unknown as ActivityItem[];
		}

		if (Object.keys(updateData).length > 0) {
			tx.update(usersTable).set(updateData).where(eq(usersTable.id, id)).run();
		}

		const updatedRow = tx
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, id))
			.get();
		if (!updatedRow) return undefined;
		return mapRowToUser(updatedRow);
	});
};

export const getUserByIdentifier = (identifier: string): User | undefined => {
	const row = db
		.select()
		.from(usersTable)
		.where(eq(usersTable.identifier, identifier))
		.get();
	if (!row) return undefined;
	return mapRowToUser(row);
};

export const listUsers = (): User[] => {
	const rows = db.select().from(usersTable).all();
	return rows.map(mapRowToUser);
};

export const deleteUser = (id: string): boolean => {
	const row = db.select().from(usersTable).where(eq(usersTable.id, id)).get();
	if (!row) {
		return false;
	}
	db.delete(usersTable).where(eq(usersTable.id, id)).run();
	return true;
};

export const clearAllUsers = (): void => {
	db.delete(usersTable).run();
};
