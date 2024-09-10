import { defineConfig } from "astro/config";
import netlify from '@astrojs/netlify/functions';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import { domains } from "googleapis/build/src/apis/domains";

// https://astro.build/config
export default defineConfig({
	output: "hybrid",
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