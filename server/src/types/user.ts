export interface ActivityItemMeta {
	recipient?: string;
	reference?: string;
	loanAmount?: number;
	loanPurpose?: string;
	loanTerm?: number;
}

export interface ActivityItem {
	id: string;
	type: "payment" | "loan";
	title: string;
	amount: number; // payments negative, loans positive
	createdAt: string; // ISO
	meta?: ActivityItemMeta;
}

export interface User {
	id: string;
	identifier: string; // personal_administrative_number
	documentNumber?: string; // document_number (kept for reference)
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
