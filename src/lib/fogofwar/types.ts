export const ACTIVITY_TYPES = [
	"UNKNOWN_ACTIVITY_TYPE",
	"WALKING",
	"RUNNING",
	"HIKING",
	"CYCLING",
	"IN_PASSENGER_VEHICLE",
	"MOTORCYCLING",
	"IN_BUS",
	"IN_TRAIN",
	"IN_SUBWAY",
	"IN_TRAM",
	"IN_FERRY",
	"FLYING",
	"SKIING",
	"SKATING",
	"IN_GONDOLA_LIFT"
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const VISIT_TYPES = [
	"UNKNOWN",
	"HOME",
	"WORK",
	"INFERRED_HOME",
	"INFERRED_WORK",
	"SEARCHED_ADDRESS",
	"ALIASED_LOCATION"
] as const;

export type VisitType = (typeof VISIT_TYPES)[number];

export interface DatasetMeta {
	segCount: number;
	pointCount: number;
	visitCount: number;
	fixCount: number;
	tMin: number;
	tMax: number;
	bbox: [number, number, number, number];
}

export interface Dataset {
	lon: Float64Array;
	lat: Float64Array;
	t: Float64Array;
	segOffset: Uint32Array;
	segKind: Uint8Array;
	segMode: Uint8Array;
	segT0: Float64Array;
	segT1: Float64Array;
	segDist: Float32Array;
	visitLon: Float64Array;
	visitLat: Float64Array;
	visitT0: Float64Array;
	visitT1: Float64Array;
	visitType: Uint8Array;
	placeIds: string[];
	fixLon: Float64Array;
	fixLat: Float64Array;
	fixT: Float64Array;
	fixAccuracy: Float32Array;
	meta: DatasetMeta;
}

export type BasemapId =
	| "dark-matter"
	| "dark-matter-nolabels"
	| "positron"
	| "positron-nolabels"
	| "voyager";

export interface Settings {
	basemap: BasemapId;
	mapOpacity: number;
	mapSaturation: number;

	fogColor: string;
	fogOpacity: number;
	featherPx: number;
	noiseAmount: number;
	noiseScale: number;
	driftSpeed: number;
	rimColor: string;
	rimStrength: number;
	vignette: number;

	radiusMetres: number;
	visitRadiusMult: number;
	modeRadiusMult: number[];

	showTracks: boolean;
	trackColorMode: "uniform" | "activity" | "year" | "speed";
	trackColor: string;
	trackWidthPx: number;
	trackGlow: number;

	showVisits: boolean;
	visitStyle: "dot" | "bloom" | "ring";
	visitSize: number;
	highlightHomeWork: boolean;

	tMin: number;
	tMax: number;
	playing: boolean;
	playSpeed: number;
	trailDays: number;

	enabledModes: boolean[];
	includeRawFixes: boolean;
	connectActivities: boolean;
	maxGapMetres: number;
	maxAccuracyMetres: number;

	title: string;
	subtitle: string;
	showStats: boolean;
	statFields: {
		distance: boolean;
		places: boolean;
		timeRange: boolean;
	};
	attributionPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
	frame: boolean;
}

export interface DatasetStats {
	totalDistanceKm: number;
	kmByMode: Record<string, number>;
	totalVisits: number;
	uniquePlaces: number;
	frequentPlacesCount: number;
	yearCounts: Record<number, number>;
	timeSpanYears: number;
}
