import { defineConfig } from "astro/config";
import netlify from '@astrojs/netlify/functions';
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	output: "server",
	site: "https://koeni.dev",
	compressHTML: true,
	publicDir: "public",
	srcDir: "src",
	adapter: netlify(),
	integrations: [
		tailwind(),
		mdx()
	]
});