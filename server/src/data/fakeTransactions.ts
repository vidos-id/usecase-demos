export interface Transaction {
	id: string;
	date: string;
	merchant: string;
	amount: number;
	currency: string;
}

export function getFakeTransactions(): Transaction[] {
	return [
		{
			id: "1",
			date: "2026-02-11",
			merchant: "Salary Deposit",
			amount: 3500.0,
			currency: "EUR",
		},
		{
			id: "2",
			date: "2026-02-10",
			merchant: "Supermart Groceries",
			amount: -87.45,
			currency: "EUR",
		},
		{
			id: "3",
			date: "2026-02-09",
			merchant: "Coffee Corner",
			amount: -4.8,
			currency: "EUR",
		},
	];
}
