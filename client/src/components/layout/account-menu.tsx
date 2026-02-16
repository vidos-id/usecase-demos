import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import {
	ChevronDown,
	Loader2,
	LogOut,
	Pencil,
	RotateCcw,
	ShieldCheck,
	User,
} from "lucide-react";
import { useState } from "react";
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
import { clearSession } from "@/lib/auth";

export function AccountMenu() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { apiClient } = useRouteContext({ from: "__root__" });
	const [menuOpen, setMenuOpen] = useState(false);
	const [resetDialogOpen, setResetDialogOpen] = useState(false);

	const { data: user } = useQuery({
		queryKey: ["user", "me"],
		queryFn: async () => {
			const res = await apiClient.api.users.me.$get({});
			if (!res.ok) throw new Error("Failed to fetch user");
			return res.json();
		},
	});

	// Mutation for sign out
	const signOutMutation = useMutation({
		mutationFn: async () => {
			await apiClient.api.session.$delete({});
		},
		onSettled: () => {
			// Always clear local state, even if API fails
			clearSession();
			queryClient.clear();
			navigate({ to: "/" });
		},
	});

	// Mutation for reset demo data
	const resetMutation = useMutation({
		mutationFn: async () => {
			const res = await apiClient.api.admin.reset.$delete({});
			if (res.ok) {
				const data = await res.json();
				return data;
			}
			throw new Error("Failed to reset demo data");
		},
		onSuccess: (data) => {
			toast.success(data.message);
		},
		onError: () => {
			toast.error("Failed to reset demo data");
		},
		onSettled: () => {
			clearSession();
			queryClient.clear();
			setResetDialogOpen(false);
			navigate({ to: "/" });
		},
	});

	const handleSignOut = () => {
		signOutMutation.mutate();
	};

	const handleViewProfile = () => {
		setMenuOpen(false);
		navigate({ to: "/profile", search: { edit: false } });
	};

	const handleUpdateProfile = () => {
		setMenuOpen(false);
		navigate({
			to: "/profile",
			search: { edit: true },
		});
	};

	const handleResetClick = () => {
		setMenuOpen(false);
		setResetDialogOpen(true);
	};

	const handleResetConfirm = () => {
		resetMutation.mutate();
	};

	const portraitUrl = getImageDataUrl(user?.portrait);

	return (
		<>
			<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-10 gap-2 px-2 hover:bg-muted/50">
						{/* Avatar */}
						<div className="relative">
							{portraitUrl ? (
								<img
									src={portraitUrl}
									alt="Profile"
									className="h-8 w-8 rounded-lg object-cover"
								/>
							) : user ? (
								<div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold">
									{user.givenName?.[0]}
									{user.familyName?.[0]}
								</div>
							) : (
								<div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
									<User className="h-4 w-4 text-muted-foreground" />
								</div>
							)}
						</div>

						{/* Name (hidden on mobile) */}
						{user && (
							<span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
								{user.givenName}
							</span>
						)}

						<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
						<span className="sr-only">Account menu</span>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className="w-56">
					{/* User info header */}
					{user && (
						<>
							<div className="px-3 py-2">
								<p className="text-sm font-medium">
									{user.givenName} {user.familyName}
								</p>
								<div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
									<ShieldCheck className="h-3 w-3 text-primary" />
									<span>PID Verified</span>
								</div>
							</div>
							<DropdownMenuSeparator />
						</>
					)}

					{/* Menu items */}
					<DropdownMenuItem
						onClick={handleViewProfile}
						className="cursor-pointer"
					>
						<User className="mr-2 h-4 w-4" />
						View Profile
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={handleUpdateProfile}
						className="cursor-pointer"
					>
						<Pencil className="mr-2 h-4 w-4" />
						Update Profile
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						onClick={handleSignOut}
						disabled={signOutMutation.isPending}
						className="cursor-pointer"
					>
						{signOutMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<LogOut className="mr-2 h-4 w-4" />
						)}
						Sign Out
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						onClick={handleResetClick}
						className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
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
				isPending={resetMutation.isPending}
			/>
		</>
	);
}
