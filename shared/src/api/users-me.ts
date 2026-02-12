import { z } from "zod";

export const activityItemMetaSchema = z.object({
	recipient: z.string().optional(),
	reference: z.string().optional(),
	loanAmount: z.number().optional(),
	loanPurpose: z.string().optional(),
	loanTerm: z.number().optional(),
});

export const activityItemSchema = z.object({
	id: z.string(),
	type: z.enum(["payment", "loan"]),
	title: z.string(),
	amount: z.number(),
	createdAt: z.string(),
	meta: activityItemMetaSchema.optional(),
});

export type ActivityItem = z.infer<typeof activityItemSchema>;

export const userProfileResponseSchema = z.object({
	id: z.string(),
	familyName: z.string(),
	givenName: z.string(),
	birthDate: z.string(),
	nationality: z.string(),
	email: z.string().optional(),
	address: z.string().optional(),
	portrait: z.string().optional(),
	balance: z.number(),
	pendingLoansTotal: z.number(),
	activity: z.array(activityItemSchema),
});

export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
