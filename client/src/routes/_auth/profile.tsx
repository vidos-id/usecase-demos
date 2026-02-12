import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { hcWithType } from "server/client";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionId } from "@/lib/auth";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const client = hcWithType(SERVER_URL);

export const Route = createFileRoute("/_auth/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const sessionId = getSessionId();

	const { data: user, isLoading } = useQuery({
		queryKey: ["user", "me"],
		queryFn: async () => {
			const res = await client.api.users.me.$get(
				{},
				{
					headers: { Authorization: `Bearer ${sessionId}` },
				},
			);
			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
	});

	if (isLoading) {
		return <div className="flex justify-center py-12">Loading...</div>;
	}

	return (
		<div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
			<h1 className="text-3xl font-bold">Your Profile</h1>

			<Card>
				<CardContent className="pt-6 space-y-6">
					{/* Portrait / Avatar */}
					<div className="flex justify-center">
						{user?.portrait ? (
							<img
								src={`data:image/jpeg;base64,${user.portrait}`}
								alt="Profile"
								className="w-24 h-24 rounded-full object-cover"
							/>
						) : (
							<div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
								{user?.givenName?.[0]}
								{user?.familyName?.[0]}
							</div>
						)}
					</div>

					{/* Profile Fields */}
					<div className="space-y-4">
						<ProfileField
							label="Full Name"
							value={`${user?.givenName} ${user?.familyName}`}
						/>
						<ProfileField label="Date of Birth" value={user?.birthDate} />
						<ProfileField label="Nationality" value={user?.nationality} />
						{user?.address && (
							<ProfileField label="Address" value={user.address} />
						)}
					</div>

					<p className="text-sm text-muted-foreground text-center">
						This information was verified from your EUDI Wallet credential.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

function ProfileField({ label, value }: { label: string; value?: string }) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center py-2 border-b">
			<span className="text-sm text-muted-foreground sm:w-1/3">{label}</span>
			<span className="font-medium">{value || "-"}</span>
		</div>
	);
}
