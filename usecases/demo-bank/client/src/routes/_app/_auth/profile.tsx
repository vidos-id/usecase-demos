import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock,
	Flag,
	IdCard,
	Loader2,
	Mail,
	MapPin,
	ShieldCheck,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CLAIM_LABELS, PROFILE_UPDATE_CLAIMS } from "demo-bank-shared/lib/claims";
import { getImageDataUrl } from "demo-bank-shared/lib/image";
import type { CredentialFormats, DcApiRequest } from "demo-bank-shared/types/auth";
import type { AuthorizationErrorInfo } from "demo-bank-shared/types/vidos-errors";
import { z } from "zod";
import { CredentialDisclosure } from "@/components/auth/credential-disclosure";
import { DCApiHandler } from "@/components/auth/dc-api-handler";
import { QRCodeDisplay } from "@/components/auth/qr-code-display";
import { VerificationStatus } from "@/components/auth/verification-status";
import { VidosErrorDisplay } from "@/components/auth/vidos-error-display";
import {
	AUTH_PAGE_MAX_WIDTH_CLASS,
	AUTH_PAGE_OUTER_CLASS,
} from "@/components/layout/auth-page";
import { Button } from "@/components/ui/button";
import { getStoredCredentialFormats, getStoredMode } from "@/lib/auth-helpers";
import { useAuthorizationStream } from "@/lib/use-authorization-stream";
import { useProfileUpdate } from "@/lib/use-profile-update";
import { cn } from "@/lib/utils";

const profileSearchSchema = z.object({
	edit: z.preprocess(
		(val) => val === true || val === "true" || val === "1",
		z.boolean(),
	),
});

export const Route = createFileRoute("/_app/_auth/profile")({
	validateSearch: profileSearchSchema,
	component: ProfilePage,
});

type ProfileUpdateState =
	| { status: "idle" }
	| { status: "selecting" }
	| {
			status: "awaiting_verification";
			mode: "direct_post";
			requestId: string;
			authorizeUrl: string;
			credentialFormats: CredentialFormats;
			requestedClaims: string[];
			purpose: string;
	  }
	| {
			status: "awaiting_verification";
			mode: "dc_api";
			requestId: string;
			dcApiRequest: DcApiRequest;
			credentialFormats: CredentialFormats;
			requestedClaims: string[];
			purpose: string;
	  }
	| {
			status: "success";
			updatedFields: string[];
			requestedClaims: string[];
	  }
	| { status: "error"; message: string; errorInfo?: AuthorizationErrorInfo }
	| { status: "expired" };

const UPDATED_FIELD_TO_CLAIM: Record<string, string> = {
	familyName: "family_name",
	givenName: "given_name",
	birthDate: "birth_date",
	nationality: "nationality",
	email: "email_address",
	address: "resident_address",
	portrait: "portrait",
};

function ProfilePage() {
	const { apiClient } = useRouteContext({ from: "__root__" });
	const navigate = useNavigate();
	const search = Route.useSearch();
	const queryClient = useQueryClient();
	const [isUpdateOpen, setIsUpdateOpen] = useState(false);
	const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
	const [state, setState] = useState<ProfileUpdateState>({ status: "idle" });

	const { data: user, isLoading } = useQuery({
		queryKey: ["user", "me"],
		queryFn: async () => {
			const res = await apiClient.api.users.me.$get({});
			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
	});

	const requestMutation = useProfileUpdate({
		onSuccess: (data, variables) => {
			if (data.mode === "direct_post") {
				setState({
					status: "awaiting_verification",
					mode: "direct_post",
					requestId: data.requestId,
					authorizeUrl: data.authorizeUrl,
					credentialFormats: variables.credentialFormats,
					requestedClaims: data.requestedClaims,
					purpose: data.purpose,
				});
			} else {
				setState({
					status: "awaiting_verification",
					mode: "dc_api",
					requestId: data.requestId,
					dcApiRequest: data.dcApiRequest,
					credentialFormats: variables.credentialFormats,
					requestedClaims: data.requestedClaims,
					purpose: data.purpose,
				});
			}
		},
		onError: (err) => {
			setState({
				status: "error",
				message: err instanceof Error ? err.message : "Unknown error",
			});
		},
	});

	const directPostRequestId =
		state.status === "awaiting_verification" && state.mode === "direct_post"
			? state.requestId
			: null;

	const isDirectPostVerificationActive =
		state.status === "awaiting_verification" && state.mode === "direct_post";

	useAuthorizationStream({
		requestId: directPostRequestId,
		streamPath: "/api/profile/update/stream",
		enabled: isDirectPostVerificationActive,
		withSession: true,
		onEvent: (event, controls) => {
			if (event.eventType === "connected" || event.eventType === "pending") {
				return;
			}

			if (event.eventType === "authorized") {
				queryClient.invalidateQueries({ queryKey: ["user", "me"] });
				setState({
					status: "success",
					updatedFields: event.updatedFields || [],
					requestedClaims:
						state.status === "awaiting_verification"
							? state.requestedClaims
							: selectedClaims,
				});
				setIsUpdateOpen(false);
				controls.close();
				return;
			}

			if (event.eventType === "expired") {
				setState({ status: "expired" });
				controls.close();
				return;
			}

			if (event.eventType === "rejected") {
				setState({
					status: "error",
					message: event.message,
					errorInfo: event.errorInfo,
				});
				controls.close();
				return;
			}

			setState({
				status: "error",
				message: event.message,
				errorInfo: "errorInfo" in event ? event.errorInfo : undefined,
			});
			controls.close();
		},
		onParseError: () => {
			setState({ status: "error", message: "Invalid stream payload" });
		},
	});

	const completeMutation = useMutation({
		mutationFn: async ({
			requestId,
			response,
		}: {
			requestId: string;
			response: Record<string, unknown>;
		}) => {
			const res = await apiClient.api.profile.update.complete[
				":requestId"
			].$post({
				param: { requestId },
				json: { origin: window.location.origin, dcResponse: response },
			});

			if (!res.ok) {
				if (res.status === 400) {
					try {
						const errorBody = (await res.json()) as {
							error?: string;
							errorInfo?: AuthorizationErrorInfo;
						};
						if (errorBody.errorInfo) {
							throw {
								type: "vidos_error" as const,
								errorInfo: errorBody.errorInfo,
							};
						}
					} catch (e) {
						if (e && typeof e === "object" && "type" in e) throw e;
					}
				}
				throw new Error("Completion failed");
			}

			return res.json();
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["user", "me"] });
			setState({
				status: "success",
				updatedFields: data.updatedFields,
				requestedClaims:
					state.status === "awaiting_verification"
						? state.requestedClaims
						: selectedClaims,
			});
			setIsUpdateOpen(false);
		},
		onError: (err) => {
			if (err && typeof err === "object" && "type" in err) {
				const typedErr = err as {
					type: string;
					errorInfo?: AuthorizationErrorInfo;
				};
				if (typedErr.type === "vidos_error" && typedErr.errorInfo) {
					setState({
						status: "error",
						message: "Verification failed",
						errorInfo: typedErr.errorInfo,
					});
					return;
				}
			}
			setState({
				status: "error",
				message: err instanceof Error ? err.message : "Completion failed",
			});
		},
	});

	const handleDCApiSuccess = (response: {
		protocol: string;
		data: Record<string, unknown>;
	}) => {
		if (state.status !== "awaiting_verification") return;
		completeMutation.mutate({
			requestId: state.requestId,
			response: response.data,
		});
	};

	const handleRequestStart = () => {
		const mode = getStoredMode();
		const credentialFormats = getStoredCredentialFormats();
		setState({ status: "selecting" });
		requestMutation.mutate({
			requestedClaims: selectedClaims,
			mode,
			credentialFormats,
		});
	};

	const handleCancel = () => {
		setState({ status: "idle" });
	};

	const handleResetSelection = () => {
		setSelectedClaims([]);
		setState({ status: "idle" });
		setIsUpdateOpen(false);
	};

	const handleRetry = () => {
		setState({ status: "idle" });
	};

	const isSelectionValid = selectedClaims.length > 0;
	const isRequesting = requestMutation.isPending;
	useEffect(() => {
		if (!search.edit) return;
		setIsUpdateOpen(true);
		setState((prev) =>
			prev.status === "idle" || prev.status === "success"
				? { status: "idle" }
				: prev,
		);
		navigate({ to: "/profile", search: { edit: false }, replace: true });
	}, [navigate, search.edit]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
					<p className="text-sm text-muted-foreground">Loading profile...</p>
				</div>
			</div>
		);
	}

	const portraitUrl = getImageDataUrl(user?.portrait);
	const updateRequestedClaims =
		state.status === "awaiting_verification"
			? state.requestedClaims
			: selectedClaims;
	const updatedFieldLabels =
		state.status === "success"
			? state.updatedFields.map((field) => {
					const claim = UPDATED_FIELD_TO_CLAIM[field] ?? field;
					return CLAIM_LABELS[claim] || field;
				})
			: [];

	return (
		<div className={AUTH_PAGE_OUTER_CLASS}>
			<div className={`${AUTH_PAGE_MAX_WIDTH_CLASS} mx-auto space-y-8`}>
				{/* Header */}
				<div className="flex items-center justify-between">
					<Button asChild variant="ghost" size="sm" className="gap-2 shrink-0">
						<Link to="/dashboard">
							<ArrowLeft className="h-4 w-4" />
							<span>Dashboard</span>
						</Link>
					</Button>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<ShieldCheck className="h-4 w-4 text-primary" />
						<span className="font-mono uppercase tracking-wider">
							PID Verified
						</span>
					</div>
				</div>

				{/* Profile Card */}
				<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
					{/* Header with gradient */}
					<div className="relative h-32 lg:h-40 bg-gradient-to-br from-primary/80 to-primary">
						<div className="absolute inset-0 opacity-20">
							<div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
							<div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white rounded-full blur-2xl translate-y-1/2 hidden lg:block" />
						</div>
					</div>

					{/* Avatar & Name section - responsive layout */}
					<div className="relative px-6 lg:px-8">
						<div className="absolute -top-16 left-6 lg:left-8">
							{portraitUrl ? (
								<img
									src={portraitUrl}
									alt="Profile"
									className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl object-cover border-4 border-background shadow-xl"
								/>
							) : (
								<div className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-3xl lg:text-4xl font-bold border-4 border-background shadow-xl">
									{user?.givenName?.[0]}
									{user?.familyName?.[0]}
								</div>
							)}
						</div>
					</div>

					{/* Name section */}
					<div className="pt-16 lg:pt-20 px-6 lg:px-8 pb-6">
						<h1 className="text-2xl lg:text-3xl font-bold">
							{user?.givenName} {user?.familyName}
						</h1>
						<p className="text-sm lg:text-base text-muted-foreground mt-1">
							Personal information from your EU Digital Identity Wallet
						</p>
					</div>

					{/* Divider */}
					<div className="h-px bg-border/60" />

					{/* Profile fields - 2-col on desktop */}
					<div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-1 lg:gap-x-8">
						<ProfileField
							icon={<User className="h-4 w-4" />}
							label="Full Name"
							value={`${user?.givenName} ${user?.familyName}`}
						/>
						<ProfileField
							icon={<Calendar className="h-4 w-4" />}
							label="Date of Birth"
							value={
								user?.birthDate
									? new Date(user.birthDate).toLocaleDateString("en-GB", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})
									: undefined
							}
						/>
						<ProfileField
							icon={<Flag className="h-4 w-4" />}
							label="Nationality"
							value={user?.nationality}
						/>
						{user?.email && (
							<ProfileField
								icon={<Mail className="h-4 w-4" />}
								label="Email"
								value={user.email}
							/>
						)}
						{user?.address && (
							<ProfileField
								icon={<MapPin className="h-4 w-4" />}
								label="Address"
								value={user.address}
							/>
						)}
					</div>
				</div>

				{/* Profile update section */}
				<div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
					<div className="p-6 lg:p-8 space-y-6">
						<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
							<div className="space-y-1">
								<h2 className="text-xl font-semibold">Update Profile</h2>
								<p className="text-sm text-muted-foreground">
									Request updated fields from your wallet and refresh your
									profile.
								</p>
							</div>
							<Button
								onClick={() => {
									setIsUpdateOpen((prev) => !prev);
									if (!isUpdateOpen) setState({ status: "idle" });
								}}
								variant={isUpdateOpen ? "secondary" : "default"}
								className="h-11"
								disabled={state.status === "awaiting_verification"}
							>
								{isUpdateOpen ? "Close" : "Update Profile"}
							</Button>
						</div>

						{state.status === "success" && (
							<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 lg:p-5">
								<div className="flex items-start gap-3">
									<div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
										<CheckCircle2 className="h-5 w-5 text-emerald-600" />
									</div>
									<div className="space-y-1">
										<p className="text-sm font-medium text-foreground">
											Profile updated
										</p>
										<p className="text-sm text-muted-foreground">
											Updated fields:{" "}
											{updatedFieldLabels.length
												? updatedFieldLabels.join(", ")
												: "No changes returned"}
										</p>
									</div>
								</div>
							</div>
						)}

						{isUpdateOpen && (
							<div className="space-y-6">
								{(state.status === "idle" || state.status === "selecting") && (
									<div className="rounded-xl border border-border/60 bg-muted/20 p-4 lg:p-6 space-y-4">
										<div className="flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
											<IdCard className="h-3.5 w-3.5" />
											Select fields to update from PID
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											{PROFILE_UPDATE_CLAIMS.map((claim) => {
												const isSelected = selectedClaims.includes(claim);
												return (
													<button
														key={claim}
														type="button"
														onClick={() => {
															setSelectedClaims((prev) =>
																prev.includes(claim)
																	? prev.filter((item) => item !== claim)
																	: [...prev, claim],
															);
														}}
														className={cn(
															"flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all",
															"hover:border-primary/40 hover:bg-primary/5",
															isSelected
																? "border-primary bg-primary/5 ring-2 ring-primary/20"
																: "border-border/60 bg-background",
														)}
													>
														<span className="text-sm font-medium">
															{CLAIM_LABELS[claim] || claim}
														</span>
														<span
															className={cn(
																"text-xs font-mono uppercase tracking-wider",
																isSelected
																	? "text-primary"
																	: "text-muted-foreground",
															)}
														>
															{isSelected ? "Selected" : "Select"}
														</span>
													</button>
												);
											})}
										</div>
										<div className="flex flex-col sm:flex-row gap-3">
											<Button
												onClick={handleResetSelection}
												variant="outline"
												className="h-12 flex-1"
												disabled={isRequesting}
											>
												Cancel
											</Button>
											<Button
												onClick={handleRequestStart}
												disabled={!isSelectionValid || isRequesting}
												className="h-12 flex-1"
											>
												{isRequesting ? "Starting update..." : "Continue"}
											</Button>
										</div>
									</div>
								)}

								{state.status === "awaiting_verification" && (
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
										<div className="rounded-xl border border-border/60 bg-background p-4 lg:p-6 space-y-4">
											<h3 className="text-lg font-semibold">Verify update</h3>
											<CredentialDisclosure
												credentialFormats={state.credentialFormats}
												requestedClaims={updateRequestedClaims}
												purpose={state.purpose}
											/>
										</div>
										<div className="rounded-xl border border-border/60 bg-background p-4 lg:p-6 space-y-4">
											{state.mode === "direct_post" ? (
												<>
													<QRCodeDisplay url={state.authorizeUrl} />
													<VerificationStatus onCancel={handleCancel} />
												</>
											) : (
												<>
													<DCApiHandler
														dcApiRequest={state.dcApiRequest}
														onSuccess={handleDCApiSuccess}
														onError={(msg) =>
															setState({ status: "error", message: msg })
														}
													/>
													{completeMutation.isPending && (
														<div className="flex items-center justify-center gap-3 py-4">
															<Loader2 className="h-5 w-5 animate-spin text-primary" />
															<p className="text-muted-foreground">
																Completing update...
															</p>
														</div>
													)}
												</>
											)}
										</div>
									</div>
								)}

								{state.status === "error" && (
									<div className="space-y-4">
										{state.errorInfo ? (
											<VidosErrorDisplay
												errorInfo={state.errorInfo}
												onRetry={handleRetry}
											/>
										) : (
											<div
												className={cn(
													"flex items-start gap-3 p-4 lg:p-6 rounded-xl",
													"bg-destructive/10 border border-destructive/20 text-destructive",
												)}
											>
												<AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
												<div className="space-y-1">
													<p className="font-medium">Update Failed</p>
													<p className="text-sm opacity-80">{state.message}</p>
												</div>
											</div>
										)}
										<div className="flex flex-col sm:flex-row gap-3">
											<Button
												onClick={handleResetSelection}
												variant="outline"
												className="h-12 flex-1"
											>
												Start Over
											</Button>
											<Button
												onClick={() => {
													if (state.status === "error") {
														setState({ status: "idle" });
													}
													handleRequestStart();
												}}
												disabled={!isSelectionValid || isRequesting}
												className="h-12 flex-1"
											>
												{isRequesting ? "Retrying..." : "Retry"}
											</Button>
										</div>
									</div>
								)}

								{state.status === "expired" && (
									<div className="space-y-4">
										<div
											className={cn(
												"flex items-start gap-3 p-4 lg:p-6 rounded-xl",
												"bg-amber-500/10 border border-amber-500/20 text-amber-700",
											)}
										>
											<Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
											<div className="space-y-1">
												<p className="font-medium">Request Expired</p>
												<p className="text-sm opacity-80">
													The verification request expired. Please try again.
												</p>
											</div>
										</div>
										<div className="flex flex-col sm:flex-row gap-3">
											<Button
												onClick={handleResetSelection}
												variant="outline"
												className="h-12 flex-1"
											>
												Start Over
											</Button>
											<Button
												onClick={handleRequestStart}
												disabled={!isSelectionValid || isRequesting}
												className="h-12 flex-1"
											>
												{isRequesting ? "Retrying..." : "Retry"}
											</Button>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Info box */}
				<div className="rounded-xl bg-primary/5 border border-primary/20 p-4 lg:p-6">
					<div className="flex gap-3 lg:gap-4">
						<div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
							<ShieldCheck className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
						</div>
						<div className="space-y-1">
							<p className="text-sm lg:text-base font-medium">
								Verified Identity
							</p>
							<p className="text-sm text-muted-foreground leading-relaxed">
								This information was cryptographically verified from your PID
								credential. It cannot be edited directly — any changes must be
								made through your wallet provider.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function ProfileField({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value?: string;
}) {
	return (
		<div className="flex items-center gap-4 py-3 border-b border-border/40 last:border-0">
			<div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground flex-shrink-0">
				{icon}
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
					{label}
				</p>
				<p className="font-medium truncate">{value || "—"}</p>
			</div>
		</div>
	);
}
