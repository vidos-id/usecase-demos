export type ShippingDestination = {
	id: string;
	label: string;
	country: string;
	region: "EU" | "US";
	legalDrinkingAge: number;
	address: string;
	recipientName: string;
	company?: string;
	streetLine1: string;
	streetLine2?: string;
	city: string;
	stateOrRegion: string;
	postalCode: string;
	phone: string;
	email: string;
};

export const shippingDestinations: ShippingDestination[] = [
	{
		id: "uk-london",
		label: "London, United Kingdom",
		country: "GB",
		region: "EU",
		legalDrinkingAge: 18,
		address: "27 Old Gloucester Street, London WC1N 3AX, UK",
		recipientName: "Oliver Whitfield",
		company: "Whitfield & Co. Wine Merchants",
		streetLine1: "27 Old Gloucester Street",
		streetLine2: "2nd Floor",
		city: "London",
		stateOrRegion: "Greater London",
		postalCode: "WC1N 3AX",
		phone: "+44 20 7946 0958",
		email: "oliver.whitfield@example.co.uk",
	},
	{
		id: "us-new-york",
		label: "New York, USA",
		country: "US",
		region: "US",
		legalDrinkingAge: 21,
		address: "350 Fifth Avenue, New York, NY 10118, USA",
		recipientName: "Oliver Whitfield",
		company: "Hudson Creative LLC",
		streetLine1: "350 Fifth Avenue",
		streetLine2: "Suite 5410",
		city: "New York",
		stateOrRegion: "NY",
		postalCode: "10118",
		phone: "+1 (212) 555-0183",
		email: "jordan.parker@example.com",
	},
];
