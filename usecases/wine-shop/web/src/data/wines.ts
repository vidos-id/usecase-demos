import { wines as sharedWines } from "demo-wine-shop-shared/lib/wines";
import franciacortaImage from "@/assets/4bd1838-1-375x400.png";
import rieslingImage from "@/assets/dr-loosen-wehlener-sonnenuhr-riesling-trockenbeerenauslese-2006-375x400.jpg";
import riojaImage from "@/assets/Imako-Cuvee-Red-Constellation-375x400.jpg";
import pichonImage from "@/assets/monteko-1000x1000px-01-375x400.jpg";
import chablisImage from "@/assets/popov_luna_eb-375x400.jpg";
import brunelloImage from "@/assets/stanushina-kartal-1000x1000px-01-375x400.png";
import roseImage from "@/assets/taittinger-comtes-de-champagne-rose-vino-espumoso-1-375x400.png";
import brutImage from "@/assets/taittinger-millesime-brut-2016-375x400.png";
import type { WineProduct } from "@/domain/catalog/catalog-types";

const wineImages: Record<string, string> = {
	"chateau-pichon-baron-2018": pichonImage,
	"brunello-di-montalcino-riserva-2016": brunelloImage,
	"rioja-reserva-vina-alta-2019": riojaImage,
	"riesling-kabinett-goldtropfchen-2022": rieslingImage,
	"chablis-premier-cru-fourchaume-2021": chablisImage,
	"cotes-de-provence-rose-2023": roseImage,
	"champagne-brut-premier-cru-nv": brutImage,
	"franciacorta-saten-millesimato-2019": franciacortaImage,
};

export const wines: WineProduct[] = sharedWines.map((wine) => ({
	...wine,
	image: wineImages[wine.id],
}));
