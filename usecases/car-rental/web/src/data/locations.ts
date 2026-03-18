export type Location = {
	id: string;
	name: string;
	code: string;
	city: string;
	country: string;
};

export const locations: Location[] = [
	{
		id: "ber-berlin-brandenburg-airport",
		name: "Berlin Brandenburg Airport",
		code: "BER",
		city: "Berlin",
		country: "Germany",
	},
	{
		id: "muc-munich-central-station",
		name: "Munich Central Station",
		code: "HBF",
		city: "Munich",
		country: "Germany",
	},
	{
		id: "ams-amsterdam-schiphol-airport",
		name: "Amsterdam Schiphol Airport",
		code: "AMS",
		city: "Amsterdam",
		country: "Netherlands",
	},
	{
		id: "vie-vienna-international-airport",
		name: "Vienna International Airport",
		code: "VIE",
		city: "Vienna",
		country: "Austria",
	},
	{
		id: "fra-frankfurt-airport",
		name: "Frankfurt Airport",
		code: "FRA",
		city: "Frankfurt",
		country: "Germany",
	},
	{
		id: "zrh-zurich-airport",
		name: "Zurich Airport",
		code: "ZRH",
		city: "Zurich",
		country: "Switzerland",
	},
];
