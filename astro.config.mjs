import { defineConfig } from "astro/config";
import netlify from '@astrojs/netlify';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
	output: "hybrid",
	site: "https://koeni.dev",
	compressHTML: true,
	publicDir: "public",
	srcDir: "src",
	adapter: netlify(),
	integrations: [
		// main.scss already declares @tailwind base/components/utilities —
		// applyBaseStyles would ship that same base layer a second time.
		tailwind({ applyBaseStyles: false }),
		mdx()
	]
});