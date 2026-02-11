export interface User {
	id: string;
	identifier: string;
	familyName: string;
	givenName: string;
	birthDate: string;
	nationality: string;
	address?: string;
	portrait?: string;
	createdAt: Date;
}
