export const MDL_CREDENTIAL_ID = "credential_mdl_driving_licence";
export const MDL_DOC_TYPE = "org.iso.18013.5.1.mDL";
export const MDL_NAMESPACE = "org.iso.18013.5.1";

export function buildCarRentalMdlAuthorizationQuery(nonce: string) {
	return {
		nonce,
		responseMode: "direct_post.jwt",
		query: {
			type: "DCQL",
			dcql: {
				id: `car-rental-${nonce.slice(0, 12)}`,
				purpose: "Verify driving licence eligibility for rental release",
				credentials: [
					{
						id: MDL_CREDENTIAL_ID,
						format: "mso_mdoc",
						meta: {
							doctype_value: MDL_DOC_TYPE,
						},
						claims: [
							{ path: [MDL_NAMESPACE, "given_name"] },
							{ path: [MDL_NAMESPACE, "family_name"] },
							{ path: [MDL_NAMESPACE, "birth_date"] },
							{ path: [MDL_NAMESPACE, "document_number"] },
							{ path: [MDL_NAMESPACE, "expiry_date"] },
							{ path: [MDL_NAMESPACE, "driving_privileges"] },
							{ path: [MDL_NAMESPACE, "portrait"] },
						],
					},
				],
			},
		},
	};
}
