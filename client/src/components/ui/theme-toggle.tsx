import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Distinctive theme toggle with morphing celestial animation.
 * Not your typical sun/moon icon swap — a smooth orbital transition.
 */
export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Avoid hydration mismatch
	if (!mounted) {
		return (
			<button
				type="button"
				className="relative h-9 w-9 rounded-xl bg-secondary/50 border border-border/50"
				aria-label="Toggle theme"
			>
				<span className="sr-only">Loading theme</span>
			</button>
		);
	}

	const isDark = resolvedTheme === "dark";

	return (
		<button
			type="button"
			onClick={() => setTheme(isDark ? "light" : "dark")}
			className="group relative h-9 w-9 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary hover:border-border transition-all duration-300 overflow-hidden"
			aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
		>
			{/* Orbital container */}
			<div
				className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
				style={{
					transform: isDark ? "rotate(180deg)" : "rotate(0deg)",
				}}
			>
				{/* Sun — warm amber in light mode, fades in dark */}
				<div
					className="absolute transition-all duration-500"
					style={{
						opacity: isDark ? 0 : 1,
						transform: isDark ? "scale(0.5) translateY(-8px)" : "scale(1)",
					}}
				>
					{/* Sun core */}
					<div className="h-4 w-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
					{/* Sun rays */}
					<div className="absolute inset-0 flex items-center justify-center">
						{[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
							<div
								key={angle}
								className="absolute h-1 w-1 rounded-full bg-amber-400/60"
								style={{
									transform: `rotate(${angle}deg) translateY(-10px)`,
								}}
							/>
						))}
					</div>
				</div>

				{/* Moon — appears in dark mode */}
				<div
					className="absolute transition-all duration-500"
					style={{
						opacity: isDark ? 1 : 0,
						transform: isDark ? "scale(1)" : "scale(0.5) translateY(8px)",
					}}
				>
					{/* Moon body with crater texture */}
					<div className="relative h-4 w-4 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.4)]">
						{/* Craters */}
						<div className="absolute top-1 left-2 h-1 w-1 rounded-full bg-slate-400/30" />
						<div className="absolute top-2.5 left-0.5 h-0.5 w-0.5 rounded-full bg-slate-400/20" />
					</div>
					{/* Stars around moon */}
					<div
						className="absolute -top-1 -right-1 h-0.5 w-0.5 rounded-full bg-white/80 animate-pulse"
						style={{ animationDelay: "0ms" }}
					/>
					<div
						className="absolute -bottom-0.5 -left-1.5 h-0.5 w-0.5 rounded-full bg-white/60 animate-pulse"
						style={{ animationDelay: "300ms" }}
					/>
				</div>
			</div>

			{/* Hover glow effect */}
			<div
				className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
				style={{
					background: isDark
						? "radial-gradient(circle at center, rgba(129,140,248,0.15) 0%, transparent 70%)"
						: "radial-gradient(circle at center, rgba(251,191,36,0.15) 0%, transparent 70%)",
				}}
			/>
		</button>
	);
}
