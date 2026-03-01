/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CAR_RENTAL_URL: string;
	readonly VITE_DEMO_BANK_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
