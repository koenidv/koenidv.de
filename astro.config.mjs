import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";
import NetlifyCMS from "astro-netlify-cms";

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind(),
		NetlifyCMS({
			config: {
				backend: {
					name: "git-gateway",
					branch: "main"
				},
        disableIdentityWidgetInjection: true,
        logo_url: "/img.jpg",
        /* todo create dialog preview styles and apply here */
				collections: [
					{
						name: "projects",
						label: "Projects",
            label_singular: "Project",
						folder: "src/content/projects",
						create: true,
						delete: true,
						fields: [
							{ name: "title", widget: "string", label: "Project Name" },
							{ name: "description", widget: "string", label: "Single line description" },
							{
								name: "image",
								widget: "string",
								label: "Image URL",
								required: false /* todo upload images to repository (see media folder) */
							},
							{ name: "link", widget: "string", label: "Project URL" },
							{ name: "tags", widget: "list", label: "Tags", required: false },
							{
								name: "date",
								widget: "datetime",
								label: "Publish Date",
								date_format: "MMM YYYY",
								time_format: ""
							},
							{
								name: "color",
								widget: "color",
								label: "Override Color",
								required: false,
								allowInput: true
							},
							{
								name: "category",
								widget: "select",
								label: "Category",
								required: false,
								options: ["tools", "people"]
							},
							{
								name: "body",
								widget: "markdown",
								label: "Content",
								required: false
							}
						]
					}
				]
			}
		})
	]
});
