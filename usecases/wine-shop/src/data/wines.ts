import franciacortaImage from "@/assets/4bd1838-1-375x400.png";
import rieslingImage from "@/assets/dr-loosen-wehlener-sonnenuhr-riesling-trockenbeerenauslese-2006-375x400.jpg";
import riojaImage from "@/assets/Imako-Cuvee-Red-Constellation-375x400.jpg";
import pichonImage from "@/assets/monteko-1000x1000px-01-375x400.jpg";
import chablisImage from "@/assets/popov_luna_eb-375x400.jpg";
import brunelloImage from "@/assets/stanushina-kartal-1000x1000px-01-375x400.png";
import roseImage from "@/assets/taittinger-comtes-de-champagne-rose-vino-espumoso-1-375x400.png";
import brutImage from "@/assets/taittinger-millesime-brut-2016-375x400.png";
import type { WineProduct } from "@/domain/catalog/catalog-types";

export const wines: WineProduct[] = [
	{
		id: "chateau-pichon-baron-2018",
		name: "Chateau Pichon Baron",
		type: "red",
		region: "Bordeaux, France",
		year: 2018,
		price: 96,
		image: pichonImage,
		description:
			"A structured Pauillac with blackcurrant, graphite, and cedar aromas. Fine-grained tannins and a persistent finish.",
	},
	{
		id: "brunello-di-montalcino-riserva-2016",
		name: "Brunello di Montalcino Riserva",
		type: "red",
		region: "Tuscany, Italy",
		year: 2016,
		price: 78,
		image: brunelloImage,
		description:
			"Classic Sangiovese depth with dried cherry, leather, and spice. Balanced acidity and polished tannins for long aging.",
	},
	{
		id: "rioja-reserva-vina-alta-2019",
		name: "Rioja Reserva Vina Alta",
		type: "red",
		region: "Rioja, Spain",
		year: 2019,
		price: 29,
		image: riojaImage,
		description:
			"Tempranillo-led blend offering red plum, vanilla, and toasted oak. Smooth texture with savory notes and fresh lift.",
	},
	{
		id: "riesling-kabinett-goldtropfchen-2022",
		name: "Riesling Kabinett Goldtropfchen",
		type: "white",
		region: "Mosel, Germany",
		year: 2022,
		price: 24,
		image: rieslingImage,
		description:
			"Delicate citrus and white peach with slate-driven minerality. Light body, vibrant acidity, and a clean, off-dry finish.",
	},
	{
		id: "chablis-premier-cru-fourchaume-2021",
		name: "Chablis Premier Cru Fourchaume",
		type: "white",
		region: "Burgundy, France",
		year: 2021,
		price: 46,
		image: chablisImage,
		description:
			"Linear Chardonnay with lemon zest, green apple, and flint. Crisp structure and saline tension through the finish.",
	},
	{
		id: "cotes-de-provence-rose-2023",
		name: "Cotes de Provence Rose",
		type: "rose",
		region: "Provence, France",
		year: 2023,
		price: 18,
		image: roseImage,
		description:
			"Pale and refreshing with wild strawberry, grapefruit, and herbal notes. Dry palate and bright, seaside freshness.",
	},
	{
		id: "champagne-brut-premier-cru-nv",
		name: "Champagne Brut Premier Cru",
		type: "sparkling",
		region: "Champagne, France",
		year: 2020,
		price: 65,
		image: brutImage,
		description:
			"Fine mousse with brioche, citrus peel, and orchard fruit. Elegant autolytic depth with energetic acidity.",
	},
	{
		id: "franciacorta-saten-millesimato-2019",
		name: "Franciacorta Saten Millesimato",
		type: "sparkling",
		region: "Lombardy, Italy",
		year: 2019,
		price: 54,
		image: franciacortaImage,
		description:
			"Silky traditional-method bubbles with white flowers, almond, and pear. Creamy texture and refined, dry finish.",
	},
];
