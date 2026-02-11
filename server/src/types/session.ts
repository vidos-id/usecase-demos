export interface Session {
	id: string;
	userId: string;
	mode: "direct_post" | "dc_api";
	createdAt: Date;
	expiresAt: Date;
}
