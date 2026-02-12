import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, RotateCcw, User } from "lucide-react";
import { useState } from "react";
import { hcWithType } from "server/client";
import { getImageDataUrl } from "shared/lib/image";
import { toast } from "sonner";
import { ResetConfirmation } from "@/components/dialogs/reset-confirmation";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearSession, getSessionId } from "@/lib/auth";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const client = hcWithType(SERVER_URL);

export function AccountMenu() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [menuOpen, setMenuOpen] = useState(false);
	const [resetDialogOpen, setResetDialogOpen] = useState(false);
	const sessionId = getSessionId();

	const { data: user } = useQuery({
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
		enabled: !!sessionId,
	});

	const handleSignOut = async () => {
		try {
			await client.api.session.$delete(
				{},
				{
					headers: { Authorization: `Bearer ${sessionId}` },
				},
			);
		} catch {
			// Continue with local cleanup even if API fails
		}
		clearSession();
		queryClient.clear();
		navigate({ to: "/" });
	};

	const handleResetClick = () => {
		setMenuOpen(false);
		setResetDialogOpen(true);
	};

	const handleResetConfirm = async () => {
		try {
			const res = await client.api.admin.reset.$delete({});
			if (res.ok) {
				const data = await res.json();
				toast.success(data.message);
			}
		} catch {
			toast.error("Failed to reset demo data");
		}
		clearSession();
		queryClient.clear();
		setResetDialogOpen(false);
		navigate({ to: "/" });
	};

	const portraitUrl = getImageDataUrl(user?.portrait);

	return (
		<>
			<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="rounded-full">
						{portraitUrl ? (
							<img
								src={portraitUrl}
								alt="Profile"
								className="size-9 rounded-full object-cover"
							/>
						) : user ? (
							<div className="size-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
								{user.givenName?.[0]}
								{user.familyName?.[0]}
							</div>
						) : (
							<User className="h-5 w-5" />
						)}
						<span className="sr-only">Account menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					{user && (
						<>
							<div className="px-2 py-1.5 text-sm font-medium">
								{user.givenName} {user.familyName}
							</div>
							<DropdownMenuSeparator />
						</>
					)}
					<DropdownMenuItem onClick={handleSignOut}>
						<LogOut className="mr-2 h-4 w-4" />
						Sign Out
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={handleResetClick}
						className="text-destructive focus:text-destructive"
					>
						<RotateCcw className="mr-2 h-4 w-4" />
						Reset Demo Data
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<ResetConfirmation
				open={resetDialogOpen}
				onOpenChange={setResetDialogOpen}
				onConfirm={handleResetConfirm}
			/>
		</>
	);
}
