export interface User {
	id: string;
	identifier: string; // personal_administrative_number
	documentNumber?: string; // document_number (kept for reference)
	familyName: string;
	givenName: string;
	birthDate: string;
	nationality: string;
	address?: string;
	portrait?: string;
	createdAt: Date;
}
