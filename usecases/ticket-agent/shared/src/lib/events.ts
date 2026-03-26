import type { Event } from "../types/events";

export const events: Event[] = [
	{
		id: "evt-001",
		name: "Berlin Philharmonic Summer Gala",
		category: "concert",
		city: "Berlin",
		venue: "Philharmonie Berlin",
		date: "2026-07-15",
		priceEur: 85,
		availableTickets: 2200,
		identityVerificationRequired: true,
		description:
			"An evening of classical masterpieces with the Berlin Philharmonic under the stars.",
		imagePrompt:
			"Grand concert hall with golden lighting and orchestra beneath a summer evening glow",
	},
	{
		id: "evt-002",
		name: "Neon Pulse Electronic Night",
		category: "concert",
		city: "Amsterdam",
		venue: "Ziggo Dome",
		date: "2026-08-22",
		priceEur: 55,
		availableTickets: 3500,
		identityVerificationRequired: true,
		description:
			"Europe's biggest electronic music acts unite for a night of pulsing beats and lasers.",
		imagePrompt:
			"Neon concert arena with laser haze, giant screens, and thousands dancing together",
	},
	{
		id: "evt-003",
		name: "Flamenco Fusion World Tour",
		category: "concert",
		city: "Barcelona",
		venue: "Palau de la Musica Catalana",
		date: "2026-06-10",
		priceEur: 70,
		availableTickets: 900,
		identityVerificationRequired: true,
		description:
			"Traditional flamenco meets modern jazz in an unforgettable evening of rhythm.",
		imagePrompt:
			"Art Nouveau concert hall with flamenco dancer, guitarist, and warm crimson lighting",
	},
	{
		id: "evt-004",
		name: "Vienna Rock Revival",
		category: "concert",
		city: "Vienna",
		venue: "Wiener Stadthalle",
		date: "2026-09-05",
		priceEur: 65,
		availableTickets: 4000,
		identityVerificationRequired: true,
		description:
			"Classic rock legends return for a one-night-only revival in the heart of Vienna.",
		imagePrompt:
			"Rock arena stage with pyrotechnics, smoke plumes, and electric guitars raised high",
	},
	{
		id: "evt-005",
		name: "Champions League Quarter-Final",
		category: "sports",
		city: "Barcelona",
		venue: "Spotify Camp Nou",
		date: "2026-04-08",
		priceEur: 120,
		availableTickets: 5000,
		identityVerificationRequired: true,
		description:
			"Witness elite European football at the legendary Camp Nou stadium.",
		imagePrompt:
			"Floodlit football stadium packed with fans and vivid green pitch before kickoff",
	},
	{
		id: "evt-006",
		name: "Berlin Marathon 2026",
		category: "sports",
		city: "Berlin",
		venue: "Brandenburg Gate",
		date: "2026-09-27",
		priceEur: 45,
		availableTickets: 2000,
		identityVerificationRequired: true,
		description:
			"Join spectators at the finish line of one of the world's greatest marathons.",
		imagePrompt:
			"Marathon runners finishing near Brandenburg Gate with banners, crowds, and autumn light",
	},
	{
		id: "evt-007",
		name: "Tour de France - Paris Stage",
		category: "sports",
		city: "Paris",
		venue: "Champs-Elysees",
		date: "2026-07-19",
		priceEur: 35,
		availableTickets: 1500,
		identityVerificationRequired: true,
		description:
			"Experience the thrilling final stage of the Tour de France on the Champs-Elysees.",
		imagePrompt:
			"Cyclists sprinting along grand boulevard with Paris monuments and cheering spectators",
	},
	{
		id: "evt-008",
		name: "European Swimming Championships",
		category: "sports",
		city: "Milan",
		venue: "Piscina Samuele",
		date: "2026-08-12",
		priceEur: 40,
		availableTickets: 800,
		identityVerificationRequired: true,
		description:
			"Top European swimmers compete in this prestigious championship event.",
		imagePrompt:
			"Modern aquatic arena with swimmers diving into bright blue lanes under spotlights",
	},
	{
		id: "evt-009",
		name: "Amsterdam Dance Event 2026",
		category: "festival",
		city: "Amsterdam",
		venue: "Multiple venues across Amsterdam",
		date: "2026-10-14",
		priceEur: 95,
		availableTickets: 3000,
		identityVerificationRequired: true,
		description:
			"Five days of electronic music across Amsterdam's best clubs and venues.",
		imagePrompt:
			"Amsterdam canals glowing at night with festival lights, boats, and energetic crowds",
	},
	{
		id: "evt-010",
		name: "Primavera Sound Barcelona",
		category: "festival",
		city: "Barcelona",
		venue: "Parc del Forum",
		date: "2026-06-04",
		priceEur: 110,
		availableTickets: 4500,
		identityVerificationRequired: true,
		description:
			"One of Europe's premier music festivals featuring indie, pop, and electronic acts.",
		imagePrompt:
			"Sunset festival stage by the sea with giant crowd and colorful banners",
	},
	{
		id: "evt-011",
		name: "Fete de la Musique Paris",
		category: "festival",
		city: "Paris",
		venue: "Across Paris",
		date: "2026-06-21",
		priceEur: 25,
		availableTickets: 5000,
		identityVerificationRequired: true,
		description:
			"The city-wide celebration of music filling every corner of Paris with live performances.",
		imagePrompt:
			"Paris street musicians performing at dusk with cafes, string lights, and joyful listeners",
	},
	{
		id: "evt-012",
		name: "Donauinselfest Vienna",
		category: "festival",
		city: "Vienna",
		venue: "Donauinsel",
		date: "2026-06-26",
		priceEur: 30,
		availableTickets: 5000,
		identityVerificationRequired: true,
		description:
			"Europe's largest open-air music festival on the Danube Island.",
		imagePrompt:
			"River island festival with multiple stages, summer sky, and thousands celebrating outdoors",
	},
	{
		id: "evt-013",
		name: "The Phantom of the Opera",
		category: "theatre",
		city: "Vienna",
		venue: "Theater an der Wien",
		date: "2026-05-20",
		priceEur: 90,
		availableTickets: 600,
		identityVerificationRequired: true,
		description:
			"The iconic musical returns to Vienna's historic Theater an der Wien.",
		imagePrompt:
			"Historic theater with chandelier glow, velvet curtains, and dramatic masked figure",
	},
	{
		id: "evt-014",
		name: "Shakespeare in the Park",
		category: "theatre",
		city: "Berlin",
		venue: "Berliner Ensemble Open Air",
		date: "2026-07-03",
		priceEur: 35,
		availableTickets: 400,
		identityVerificationRequired: true,
		description:
			"A Midsummer Night's Dream performed under the Berlin summer sky.",
		imagePrompt:
			"Open-air stage in leafy park with actors in elaborate Renaissance costumes",
	},
	{
		id: "evt-015",
		name: "Cirque Nouveau: Gravity",
		category: "theatre",
		city: "Paris",
		venue: "Theatre du Chatelet",
		date: "2026-09-15",
		priceEur: 75,
		availableTickets: 700,
		identityVerificationRequired: true,
		description:
			"A gravity-defying contemporary circus spectacular blending acrobatics and theater.",
		imagePrompt:
			"Aerial silk acrobats soaring above grand stage with moody theatrical spotlights",
	},
	{
		id: "evt-016",
		name: "La Scala Opera Premiere",
		category: "theatre",
		city: "Milan",
		venue: "Teatro alla Scala",
		date: "2026-12-07",
		priceEur: 150,
		availableTickets: 500,
		identityVerificationRequired: true,
		description:
			"The prestigious opening night of the opera season at La Scala.",
		imagePrompt:
			"Lavish opera house with gilded balconies, red velvet, and performers in costume",
	},
	{
		id: "evt-017",
		name: "Euro Comedy Slam",
		category: "comedy",
		city: "Amsterdam",
		venue: "Boom Chicago",
		date: "2026-05-10",
		priceEur: 40,
		availableTickets: 300,
		identityVerificationRequired: true,
		description:
			"Europe's funniest stand-up comedians battle it out in Amsterdam.",
		imagePrompt:
			"Intimate comedy club with brick backdrop, spotlight, and crowd laughing loudly",
	},
	{
		id: "evt-018",
		name: "Berlin Stand-Up Festival",
		category: "comedy",
		city: "Berlin",
		venue: "Admiralspalast",
		date: "2026-11-08",
		priceEur: 35,
		availableTickets: 500,
		identityVerificationRequired: true,
		description:
			"A weekend of world-class stand-up at Berlin's premier comedy venue.",
		imagePrompt:
			"Art deco theater hosting stand-up comic with warm lights and packed seats",
	},
	{
		id: "evt-019",
		name: "Improv Night Barcelona",
		category: "comedy",
		city: "Barcelona",
		venue: "Teatreneu",
		date: "2026-04-18",
		priceEur: 28,
		availableTickets: 200,
		identityVerificationRequired: true,
		description:
			"Fast-paced improv comedy in English and Spanish in the Gothic Quarter.",
		imagePrompt:
			"Cozy black box theater with improv performers engaging a lively audience",
	},
	{
		id: "evt-020",
		name: "Paris Comedy Club International",
		category: "comedy",
		city: "Paris",
		venue: "Le Point Virgule",
		date: "2026-08-30",
		priceEur: 32,
		availableTickets: 250,
		identityVerificationRequired: true,
		description:
			"International comedians perform in French and English at a legendary Parisian comedy club.",
		imagePrompt:
			"Paris comedy cellar with small stage, amber lights, and an enthusiastic crowd",
	},
];

export function getEventById(id: string): Event | undefined {
	return events.find((e) => e.id === id);
}

export function filterEvents(filters: {
	category?: string;
	city?: string;
}): Event[] {
	return events.filter((e) => {
		if (filters.category && e.category !== filters.category) return false;
		if (filters.city && e.city !== filters.city) return false;
		return true;
	});
}
