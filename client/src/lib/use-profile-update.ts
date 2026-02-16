import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import type { ProfileUpdateRequestResponse } from "shared/api/profile-update";
import type { PresentationMode } from "shared/types/auth";

type ProfileUpdateMutationVariables = {
	requestedClaims: string[];
	mode: PresentationMode;
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
		mutationFn: async ({ requestedClaims, mode }) => {
			const res = await apiClient.api.profile.update.request.$post({
				json:
					mode === "dc_api"
						? {
								mode: "dc_api" as const,
								origin: window.location.origin,
								requestedClaims,
							}
						: {
								mode: "direct_post" as const,
								requestedClaims,
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
