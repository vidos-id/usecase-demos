/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_VIDOS_DEMO_BANK_SERVER_URL: string;
	readonly VITE_HOME_WALLET_SETUP_URL: string;
	readonly VITE_HOME_CREDENTIAL_PREP_URL: string;
	readonly VITE_HOME_HOW_DEMOS_WORK_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
