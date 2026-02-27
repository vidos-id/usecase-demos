import audiA3Image from "@/assets/audi-a3-sportback-hatch-4d--black-2020.png";
import audiA6Image from "@/assets/audi-a6-4d-grau-2018.png";
import bmwX1Image from "@/assets/bmw-x1-5d-weiss-2019.png";
import fiat500Image from "@/assets/fiat-500-hatch-2d-grey-2020.png";
import mbGlbImage from "@/assets/mb-glb-suv-silver-2021.png";
import renaultClioImage from "@/assets/renault-clio-5d-blue-2024.png";
import vwTiguanImage from "@/assets/vw-tiguan-5d-grau-2019.png";
import vwTouranImage from "@/assets/vw-touran-van-weiss-2016.png";

export type Car = {
	id: string;
	name: string;
	brand: string;
	category: string;
	transmission: "Automatic" | "Manual";
	seats: number;
	pricePerDay: number;
	fuelType: "Petrol" | "Electric" | "Hybrid" | "Diesel";
	imageUrl: string;
	features: string[];
};

export const cars: Car[] = [
	{
		id: "audi-a3-sportback",
		name: "Audi A3 Sportback",
		brand: "Audi",
		category: "Compact",
		transmission: "Automatic",
		seats: 5,
		pricePerDay: 52,
		fuelType: "Petrol",
		imageUrl: audiA3Image,
		features: ["Virtual Cockpit", "LED Lights", "Cruise Control"],
	},
	{
		id: "audi-a6",
		name: "Audi A6",
		brand: "Audi",
		category: "Premium Sedan",
		transmission: "Automatic",
		seats: 5,
		pricePerDay: 89,
		fuelType: "Diesel",
		imageUrl: audiA6Image,
		features: ["Matrix LED", "Adaptive Cruise", "Bang & Olufsen Audio"],
	},
	{
		id: "bmw-x1",
		name: "BMW X1",
		brand: "BMW",
		category: "SUV",
		transmission: "Automatic",
		seats: 5,
		pricePerDay: 74,
		fuelType: "Diesel",
		imageUrl: bmwX1Image,
		features: ["All-Wheel Drive", "Navigation", "Parking Assist"],
	},
	{
		id: "fiat-500",
		name: "Fiat 500",
		brand: "Fiat",
		category: "City Car",
		transmission: "Manual",
		seats: 4,
		pricePerDay: 29,
		fuelType: "Petrol",
		imageUrl: fiat500Image,
		features: ["Compact Parking", "USB Charging", "Climate Control"],
	},
	{
		id: "mercedes-glb",
		name: "Mercedes-Benz GLB",
		brand: "Mercedes-Benz",
		category: "SUV",
		transmission: "Automatic",
		seats: 7,
		pricePerDay: 95,
		fuelType: "Diesel",
		imageUrl: mbGlbImage,
		features: ["7 Seats", "MBUX Infotainment", "Rear Camera"],
	},
	{
		id: "renault-clio",
		name: "Renault Clio",
		brand: "Renault",
		category: "Compact",
		transmission: "Manual",
		seats: 5,
		pricePerDay: 38,
		fuelType: "Petrol",
		imageUrl: renaultClioImage,
		features: ["Bluetooth", "Lane Assist", "Rear Sensors"],
	},
	{
		id: "vw-tiguan",
		name: "Volkswagen Tiguan",
		brand: "Volkswagen",
		category: "SUV",
		transmission: "Automatic",
		seats: 5,
		pricePerDay: 72,
		fuelType: "Diesel",
		imageUrl: vwTiguanImage,
		features: ["All-Wheel Drive", "Panoramic Roof", "Adaptive Cruise"],
	},
	{
		id: "vw-touran",
		name: "Volkswagen Touran",
		brand: "Volkswagen",
		category: "Van",
		transmission: "Automatic",
		seats: 7,
		pricePerDay: 65,
		fuelType: "Diesel",
		imageUrl: vwTouranImage,
		features: ["7 Seats", "Sliding Doors", "Rear Camera"],
	},
];
