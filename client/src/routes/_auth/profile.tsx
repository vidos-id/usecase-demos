import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import {
	ArrowLeft,
	Calendar,
	Flag,
	Mail,
	MapPin,
	ShieldCheck,
	User,
} from "lucide-react";
import { getImageDataUrl } from "shared/lib/image";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const { apiClient } = useRouteContext({ from: "__root__" });

	const { data: user, isLoading } = useQuery({
		queryKey: ["user", "me"],
		queryFn: async () => {
			const res = await apiClient.api.users.me.$get({});
			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
	});

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

	return (
		<div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto space-y-8">
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
