import { defineConfig } from "drizzle-kit";

export default defineConfig({
dialect: "sqlite",
schema: "./src/db/schema/*.ts",
out: "./drizzle",
dbCredentials: {
url: process.env.VIDOS_SQLITE_PATH ?? "./data/vidos.sqlite",
},
strict: true,
verbose: true,
});
