/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		extend: {
			fontFamily: {
				poppins: ["Poppins", ...defaultTheme.fontFamily.sans]
			},
			colors: {
				beige: {
					50: "#fcfbf7",
					100: "#f5f0e5",
					200: "#eee5d3",
					300: "#e7dbc0",
					400: "#e0d0ae",
				},
				mojito: {
					50: "#fbfff5",
					100: "#f1ffdc",
					200: "#e7ffc2",
				}
			}
		},
	},
	plugins: []
};
