import { useNavigate } from "@tanstack/react-router";
import { LogOut, RotateCcw, User } from "lucide-react";
import { useState } from "react";
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
	const [open, setOpen] = useState(false);

	const handleSignOut = () => {
		clearSession();
		navigate({ to: "/" });
	};

	const handleReset = () => {
		// TODO: Implement in admin-reset change
		// Will call DELETE /api/admin/reset
		clearSession();
		navigate({ to: "/" });
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="rounded-full">
					<User className="h-5 w-5" />
					<span className="sr-only">Account menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuItem onClick={handleSignOut}>
					<LogOut className="mr-2 h-4 w-4" />
					Sign Out
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleReset}
					className="text-destructive focus:text-destructive"
				>
					<RotateCcw className="mr-2 h-4 w-4" />
					Reset Demo Data
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
