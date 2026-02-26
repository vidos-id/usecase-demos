import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import type { ProfileUpdateRequestResponse } from "demo-bank-shared/api/profile-update";
import type { CredentialFormats, PresentationMode } from "demo-bank-shared/types/auth";

type ProfileUpdateMutationVariables = {
	requestedClaims: string[];
	mode: PresentationMode;
	credentialFormats: CredentialFormats;
};

export function useProfileUpdate(
	options?: UseMutationOptions<
		ProfileUpdateRequestResponse,
		Error,
		ProfileUpdateMutationVariables
	>,
) {
	const { apiClient } = useRouteContext({ from: "__root__" });

	return useMutation<
		ProfileUpdateRequestResponse,
		Error,
		ProfileUpdateMutationVariables
	>({
		mutationFn: async ({ requestedClaims, mode, credentialFormats }) => {
			const res = await apiClient.api.profile.update.request.$post({
				json:
					mode === "dc_api"
						? {
								mode: "dc_api" as const,
								origin: window.location.origin,
								requestedClaims,
								credentialFormats,
							}
						: {
								mode: "direct_post" as const,
								requestedClaims,
								credentialFormats,
							},
			});

			if (!res.ok) {
				throw new Error("Failed to create profile update request");
			}

			return (await res.json()) as ProfileUpdateRequestResponse;
		},
		...options,
	});
}
