import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<button
				type="button"
				className="h-9 w-9 rounded-xl bg-secondary/50 border border-border/50"
				aria-label="Toggle theme"
			>
				<span className="sr-only">Loading theme</span>
			</button>
		);
	}

	const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : SunMoon;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="h-9 w-9 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-border transition-colors flex items-center justify-center"
					aria-label="Toggle theme"
				>
					<Icon className="h-4 w-4" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")}>
					<Sun className="h-4 w-4 mr-2" />
					Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					<Moon className="h-4 w-4 mr-2" />
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>
					<SunMoon className="h-4 w-4 mr-2" />
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
