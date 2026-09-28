import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
	basemap: "dark-matter",
	mapOpacity: 1.0,
	mapSaturation: 1.0,

	fogColor: "#08090f",
	fogOpacity: 0.96,
	featherPx: 12,
	noiseAmount: 0.28,
	noiseScale: 40.0,
	driftSpeed: 0.08,
	rimColor: "#38bdf8",
	rimStrength: 0.45,
	vignette: 0.35,

	radiusMetres: 250,
	visitRadiusMult: 2.0,
	modeRadiusMult: [
		1.0, // UNKNOWN_ACTIVITY_TYPE
		0.7, // WALKING
		0.8, // RUNNING
		0.9, // HIKING
		1.0, // CYCLING
		1.2, // IN_PASSENGER_VEHICLE
		1.1, // MOTORCYCLING
		1.2, // IN_BUS
		1.4, // IN_TRAIN
		1.2, // IN_SUBWAY
		1.2, // IN_TRAM
		1.5, // IN_FERRY
		3.0, // FLYING
		1.0, // SKIING
		0.8, // SKATING
		1.2 // IN_GONDOLA_LIFT
	],

	showTracks: false,
	trackColorMode: "uniform",
	trackColor: "#c5fc6f",
	trackWidthPx: 2.0,
	trackGlow: 0.4,

	showVisits: true,
	visitStyle: "bloom",
	visitSize: 12.0,
	highlightHomeWork: true,

	tMin: 0,
	tMax: 0,
	playing: false,
	playSpeed: 60,
	trailDays: 0,

	enabledModes: new Array(16).fill(true),
	includeRawFixes: false,
	connectActivities: false,
	maxGapMetres: 500,
	maxAccuracyMetres: 50,

	title: "MY FOG OF WAR",
	subtitle: "Google Maps Timeline Exploration",
	showStats: true,
	statFields: {
		distance: true,
		places: true,
		timeRange: true
	},
	attributionPosition: "bottom-right",
	frame: false
};

export interface PalettePreset {
	id: string;
	name: string;
	patch: Partial<Settings>;
}

export const PALETTES: Record<string, PalettePreset> = {
	midnight: {
		id: "midnight",
		name: "Midnight",
		patch: {
			basemap: "dark-matter",
			fogColor: "#05070f",
			rimColor: "#00f0ff",
			rimStrength: 0.55,
			trackColor: "#38bdf8"
		}
	},
	paper: {
		id: "paper",
		name: "Paper",
		patch: {
			basemap: "positron",
			fogColor: "#f5f0e5",
			rimColor: "#c5fc6f",
			rimStrength: 0.45,
			trackColor: "#131218"
		}
	},
	ember: {
		id: "ember",
		name: "Ember",
		patch: {
			basemap: "dark-matter",
			fogColor: "#120806",
			rimColor: "#ff5e1a",
			rimStrength: 0.6,
			trackColor: "#fbbf24"
		}
	},
	aurora: {
		id: "aurora",
		name: "Aurora",
		patch: {
			basemap: "dark-matter-nolabels",
			fogColor: "#041410",
			rimColor: "#22c55e",
			rimStrength: 0.6,
			trackColor: "#a7f3d0"
		}
	},
	blueprint: {
		id: "blueprint",
		name: "Blueprint",
		patch: {
			basemap: "dark-matter-nolabels",
			fogColor: "#0a192f",
			rimColor: "#64ffda",
			rimStrength: 0.5,
			trackColor: "#93c5fd"
		}
	}
};
