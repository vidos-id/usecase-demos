export interface paths {
	"/openid4/vp/v1_0/authorizations": {
		post: operations["createAuthorization"];
	};
	"/openid4/vp/v1_0/authorizations/{authorizationId}/status": {
		get: operations["getAuthorizationStatus"];
	};
	"/openid4/vp/v1_0/authorizations/{authorizationId}/policy-response": {
		get: operations["getPolicyResponse"];
	};
	"/openid4/vp/v1_0/authorizations/{authorizationId}/credentials": {
		get: operations["getCredentials"];
	};
}

export interface components {
	schemas: {
		DcqlQuery: {
			id: string;
			purpose?: string;
			credentials: Array<{
				id: string;
				format: string;
				meta?: {
					vct_values?: string[];
				};
				claims: Array<{
					path: (string | number)[];
					optional?: boolean;
				}>;
			}>;
		};
		PolicyCheck: {
			id: string;
			status: "pass" | "fail" | "unknown";
			message?: string;
			path: (string | number)[];
		};
		Credential: {
			id: string;
			format: string;
			claims: Record<string, unknown>;
		};
	};
}

export interface operations {
	createAuthorization: {
		requestBody: {
			content: {
				"application/json": {
					nonce?: string;
					responseMode:
						| "direct_post"
						| "direct_post.jwt"
						| "dc_api"
						| "dc_api.jwt";
					query: {
						type: "DCQL";
						dcql: components["schemas"]["DcqlQuery"];
					};
				};
			};
		};
		responses: {
			201: {
				content: {
					"application/json": {
						authorizationId: string;
						authorizeUrl?: string;
						expiresAt: string;
						nonce: string;
					};
				};
			};
		};
	};
	getAuthorizationStatus: {
		parameters: {
			path: {
				authorizationId: string;
			};
		};
		responses: {
			200: {
				content: {
					"application/json": {
						status:
							| "created"
							| "pending_wallet"
							| "processing"
							| "authorized"
							| "completed"
							| "success"
							| "rejected"
							| "expired"
							| "error";
					};
				};
			};
		};
	};
	getPolicyResponse: {
		parameters: {
			path: {
				authorizationId: string;
			};
		};
		responses: {
			200: {
				content: {
					"application/json": {
						data: {
							overallStatus: "pass" | "fail" | "unknown";
							checks: components["schemas"]["PolicyCheck"][];
						};
					};
				};
			};
		};
	};
	getCredentials: {
		parameters: {
			path: {
				authorizationId: string;
			};
		};
		responses: {
			200: {
				content: {
					"application/json": {
						credentials: components["schemas"]["Credential"][];
					};
				};
			};
		};
	};
}
