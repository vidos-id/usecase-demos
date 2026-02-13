import type { ActivityItem } from "shared/api/users-me";
import { activitiesRepository } from "../repositories/activities-repository";
import { usersRepository } from "../repositories/users-repository";

const BASE_BALANCE = 12450;

function parseMetadata(raw: string | null) {
if (!raw) return undefined;
const parsed = JSON.parse(raw) as Record<string, unknown>;
return {
recipient:
typeof parsed.recipient === "string" ? parsed.recipient : undefined,
reference:
typeof parsed.reference === "string" ? parsed.reference : undefined,
loanAmount:
typeof parsed.loanAmount === "number" ? parsed.loanAmount : undefined,
loanPurpose:
typeof parsed.loanPurpose === "string" ? parsed.loanPurpose : undefined,
loanTerm: typeof parsed.loanTerm === "number" ? parsed.loanTerm : undefined,
};
}

export function getUserProfileById(userId: string) {
	const user = usersRepository.findById(userId);
	if (!user) return undefined;
	const activityRows = activitiesRepository.listByUserId(userId);
	const activity: ActivityItem[] = activityRows.map((item: (typeof activityRows)[number]) => ({
id: item.id,
type: item.kind,
title: item.title,
amount: item.amount,
createdAt: item.createdAt,
meta: parseMetadata(item.metadata),
}));

const delta = activity.reduce((sum, item) => sum + item.amount, 0);
const pendingLoansTotal = activity
.filter((item) => item.type === "loan")
.reduce((sum, item) => sum + item.amount, 0);

return {
id: user.id,
familyName: user.familyName,
givenName: user.givenName,
birthDate: user.birthDate ?? "",
nationality: user.nationality ?? "",
email: user.email ?? undefined,
address: user.address ?? undefined,
portrait: user.portrait ?? undefined,
balance: BASE_BALANCE + delta,
pendingLoansTotal,
activity,
};
}
