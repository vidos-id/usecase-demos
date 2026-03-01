export type WineType = "red" | "white" | "rose" | "sparkling";

export type WineProduct = {
	id: string;
	name: string;
	type: WineType;
	region: string;
	year: number;
	price: number;
	image: string;
	description: string;
};

export type CartItem = {
	product: WineProduct;
	quantity: number;
};

export type Cart = {
	items: CartItem[];
};
