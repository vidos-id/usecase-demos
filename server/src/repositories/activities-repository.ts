import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { activitiesTable } from "../db/schema";
import { activitySelectSchema } from "../db/zod/activities";

export interface ActivityMeta {
recipient?: string;
reference?: string;
loanAmount?: number;
loanPurpose?: string;
loanTerm?: number;
}

export const activitiesRepository = {
	create(input: {
		userId: string;
		kind: "payment" | "loan";
		title: string;
		amount: number;
		metadata?: ActivityMeta;
		createdAt?: string;
	}) {
		const row = {
			id: randomUUID(),
			userId: input.userId,
			kind: input.kind,
			title: input.title,
			amount: input.amount,
			metadata: input.metadata ? JSON.stringify(input.metadata) : null,
			createdAt: input.createdAt ?? new Date().toISOString(),
		};
db.insert(activitiesTable).values(row).run();
return activitySelectSchema.parse(row);
},
	listByUserId(userId: string) {
		return db
			.select()
			.from(activitiesTable)
			.where(eq(activitiesTable.userId, userId))
			.orderBy(desc(activitiesTable.createdAt))
			.all()
			.map((row) => activitySelectSchema.parse(row));
	},
clearAll() {
db.delete(activitiesTable).run();
},
};
