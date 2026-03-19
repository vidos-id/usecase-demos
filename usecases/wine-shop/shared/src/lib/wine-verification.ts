import type { paths } from "vidos-api/authorizer-api";
import type { WineAgeVerificationMethod } from "../types/verification";

type CreateAuthorizationBody = NonNullable<
	paths["/openid4/vp/v1_0/authorizations"]["post"]["requestBody"]
>["content"]["application/json"];

export type SharedAuthorizerStatus =
	| "created"
	| "pending"
	| "pending_wallet"
	| "processing"
	| "authorized"
	| "completed"
	| "success"
	| "rejected"
	| "expired"
	| "error";

type BuildWinePurchaseAuthorizationInput = {
	nonce?: string;
	requiredAge: number;
	ageVerificationMethod: WineAgeVerificationMethod;
	purpose: string;
	queryId: string;
	requireHolderBinding?: boolean;
};

export function buildWinePurchaseAuthorizationBody(
	input: BuildWinePurchaseAuthorizationInput,
): CreateAuthorizationBody {
	const minimumAgePath = String(input.requiredAge);
	const credentialId = `age-${minimumAgePath}-pid-cred`;

	let claimPath: (string | number)[];
	switch (input.ageVerificationMethod) {
		case "age_equal_or_over":
			claimPath = ["age_equal_or_over", minimumAgePath];
			break;
		case "age_in_years":
			claimPath = ["age_in_years"];
			break;
		case "birthdate":
			claimPath = ["birthdate"];
			break;
	}

	return {
		nonce: input.nonce,
		responseMode: "direct_post.jwt",
		query: {
			type: "DCQL",
			dcql: {
				id: input.queryId,
				purpose: input.purpose,
				credentials: [
					{
						id: credentialId,
						format: "dc+sd-jwt",
						meta: {
							vct_values: ["urn:eudi:pid:1"],
						},
						...(input.requireHolderBinding
							? {
									require_cryptographic_holder_binding: true,
								}
							: {}),
						claims: [{ path: claimPath }],
					},
				],
			},
		},
	} satisfies CreateAuthorizationBody;
}
