import type { WineProduct as SharedWineProduct } from "demo-wine-shop-shared/types/catalog";

export type { WineType } from "demo-wine-shop-shared/types/catalog";

export type WineProduct = SharedWineProduct & {
	image: string;
};

export type CartItem = {
	product: WineProduct;
	quantity: number;
};

export type Cart = {
	items: CartItem[];
};
