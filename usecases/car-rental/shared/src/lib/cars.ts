import {
	type BookingVehicle,
	type RentalTripContext,
	type RentalVehicle,
	rentalVehicleSchema,
} from "../types/rental";

const carCatalogSource = [
	{
		id: "audi-a3-sportback",
		name: "Audi A3 Sportback",
		brand: "Audi",
		category: "Compact",
		requiredLicenceCategory: "B",
		minimumDriverAge: 21,
		transmission: "Automatic",
		seats: 5,
		pricePerDay: 52,
		fuelType: "Petrol",
		imagePath: "/car-rental/cars/audi-a3-sportback-hatch-4d--black-2020.png",
		features: ["Virtual Cockpit", "LED Lights", "Cruise Control"],
		comparisonHighlights: ["easy city parking", "premium compact cabin"],
	},
	{
		id: "audi-a6",
		name: "Audi A6",
		brand: "Audi",
		category: "Premium Sedan",
		requiredLicenceCategory: "B",
		minimumDriverAge: 25,
		transmission: "Automatic",
		seats: 5,
		pricePerDay: 89,
		fuelType: "Diesel",
		imagePath: "/car-rental/cars/audi-a6-4d-grau-2018.png",
		features: ["Matrix LED", "Adaptive Cruise", "Bang & Olufsen Audio"],
		comparisonHighlights: ["executive comfort", "best for highway miles"],
	},
	{
		id: "bmw-x1",
		name: "BMW X1",
		brand: "BMW",
		category: "SUV",
		requiredLicenceCategory: "B",
		minimumDriverAge: 23,
		transmission: "Automatic",
		seats: 5,
		pricePerDay: 74,
		fuelType: "Diesel",
		imagePath: "/car-rental/cars/bmw-x1-5d-weiss-2019.png",
		features: ["All-Wheel Drive", "Navigation", "Parking Assist"],
		comparisonHighlights: ["great visibility", "comfortable island roads"],
	},
	{
		id: "fiat-500",
		name: "Fiat 500",
		brand: "Fiat",
		category: "City Car",
		requiredLicenceCategory: "B",
		minimumDriverAge: 18,
		transmission: "Manual",
		seats: 4,
		pricePerDay: 29,
		fuelType: "Petrol",
		imagePath: "/car-rental/cars/fiat-500-hatch-2d-grey-2020.png",
		features: ["Compact Parking", "USB Charging", "Climate Control"],
		comparisonHighlights: ["lowest daily rate", "best for narrow streets"],
	},
	{
		id: "mercedes-glb",
		name: "Mercedes-Benz GLB",
		brand: "Mercedes-Benz",
		category: "SUV",
		requiredLicenceCategory: "B",
		minimumDriverAge: 25,
		transmission: "Automatic",
		seats: 7,
		pricePerDay: 95,
		fuelType: "Diesel",
		imagePath: "/car-rental/cars/mb-glb-suv-silver-2021.png",
		features: ["7 Seats", "MBUX Infotainment", "Rear Camera"],
		comparisonHighlights: ["family friendly", "room for the whole group"],
	},
	{
		id: "renault-clio",
		name: "Renault Clio",
		brand: "Renault",
		category: "Compact",
		requiredLicenceCategory: "B",
		minimumDriverAge: 18,
		transmission: "Manual",
		seats: 5,
		pricePerDay: 38,
		fuelType: "Petrol",
		imagePath: "/car-rental/cars/renault-clio-5d-blue-2024.png",
		features: ["Bluetooth", "Lane Assist", "Rear Sensors"],
		comparisonHighlights: ["budget friendly", "easy first rental choice"],
	},
	{
		id: "vw-tiguan",
		name: "Volkswagen Tiguan",
		brand: "Volkswagen",
		category: "SUV",
		requiredLicenceCategory: "B",
		minimumDriverAge: 23,
		transmission: "Automatic",
		seats: 5,
		pricePerDay: 72,
		fuelType: "Diesel",
		imagePath: "/car-rental/cars/vw-tiguan-5d-grau-2019.png",
		features: ["All-Wheel Drive", "Panoramic Roof", "Adaptive Cruise"],
		comparisonHighlights: [
			"strong luggage space",
			"balanced comfort and value",
		],
	},
	{
		id: "vw-t6-van",
		name: "Volkswagen T6",
		brand: "Volkswagen",
		category: "Van",
		requiredLicenceCategory: "C1",
		minimumDriverAge: 25,
		transmission: "Manual",
		seats: 9,
		pricePerDay: 84,
		fuelType: "Diesel",
		imagePath: "/car-rental/cars/vw-t6-van-schwarz-2017.png",
		features: ["9 Seats", "Sliding Doors", "Cargo Space"],
		comparisonHighlights: ["team trips", "large passenger capacity"],
	},
	{
		id: "vw-touran",
		name: "Volkswagen Touran",
		brand: "Volkswagen",
		category: "Van",
		requiredLicenceCategory: "B",
		minimumDriverAge: 21,
		transmission: "Automatic",
		seats: 7,
		pricePerDay: 65,
		fuelType: "Diesel",
		imagePath: "/car-rental/cars/vw-touran-van-weiss-2016.png",
		features: ["7 Seats", "Sliding Doors", "Rear Camera"],
		comparisonHighlights: [
			"family road trips",
			"extra seats without van licence",
		],
	},
] as const satisfies readonly RentalVehicle[];

export const cars = rentalVehicleSchema.array().parse(carCatalogSource);

const MS_PER_DAY = 86_400_000;

export function estimateRentalDays(input: {
	pickupDate?: string;
	dropoffDate?: string;
}): number {
	if (!input.pickupDate || !input.dropoffDate) {
		return 5;
	}

	const pickup = new Date(input.pickupDate);
	const dropoff = new Date(input.dropoffDate);
	if (Number.isNaN(pickup.getTime()) || Number.isNaN(dropoff.getTime())) {
		return 5;
	}

	return Math.max(
		1,
		Math.round((dropoff.getTime() - pickup.getTime()) / MS_PER_DAY),
	);
}

export function estimateRentalTotal(
	vehicle: Pick<RentalVehicle, "pricePerDay">,
	days: number,
): number {
	return vehicle.pricePerDay * Math.max(1, days);
}

export function toBookingVehicle(vehicle: RentalVehicle): BookingVehicle {
	return {
		id: vehicle.id,
		name: vehicle.name,
		category: vehicle.category,
		requiredLicenceCategory: vehicle.requiredLicenceCategory,
		minimumDriverAge: vehicle.minimumDriverAge,
		imagePath: vehicle.imagePath,
		pricePerDay: vehicle.pricePerDay,
		currency: "EUR",
	};
}

function scoreVehicle(vehicle: RentalVehicle, trip: RentalTripContext): number {
	let score = 0;
	const destination = trip.destination.toLowerCase();
	const days = estimateRentalDays({
		pickupDate: trip.pickupDate,
		dropoffDate: trip.dropoffDate,
	});

	if (trip.prefersAutomatic && vehicle.transmission === "Automatic") {
		score += 4;
	}

	if (trip.passengerCount && vehicle.seats >= trip.passengerCount) {
		score += 3;
	}

	if (
		trip.needsLargeLuggageSpace &&
		["SUV", "Van"].includes(vehicle.category)
	) {
		score += 3;
	}

	if (destination.includes("tenerife")) {
		if (["Compact", "City Car"].includes(vehicle.category)) {
			score += 3;
		}
		if (vehicle.transmission === "Automatic") {
			score += 1;
		}
	}

	if (days >= 6 && ["SUV", "Premium Sedan", "Van"].includes(vehicle.category)) {
		score += 2;
	}

	score -= vehicle.pricePerDay / 100;

	return score;
}

export function rankCarsForTrip(trip: RentalTripContext): RentalVehicle[] {
	return [...cars].sort(
		(left, right) => scoreVehicle(right, trip) - scoreVehicle(left, trip),
	);
}
