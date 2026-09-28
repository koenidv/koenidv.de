import * as maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type { Dataset, DatasetStats, Settings } from "../types";
import { FogLayer } from "../render/fogLayer";
import { drawOverlay } from "./overlay";

export interface ExportPreset {
	id: string;
	name: string;
	width: number;
	height: number;
	scale: number;
}

export const EXPORT_PRESETS: ExportPreset[] = [
	{ id: "a3", name: "Poster A3 (300 dpi)", width: 3508, height: 4960, scale: 2 },
	{ id: "a2", name: "Poster A2 (300 dpi)", width: 4960, height: 7016, scale: 2 },
	{ id: "4k", name: "Wallpaper 4K (16:9)", width: 3840, height: 2160, scale: 2 },
	{ id: "square", name: "Square Print (2048²)", width: 2048, height: 2048, scale: 2 },
	{ id: "phone", name: "Phone Lockscreen", width: 1290, height: 2796, scale: 2 }
];

export async function exportHighResPng(
	liveMap: Map,
	dataset: Dataset,
	settings: Settings,
	stats: DatasetStats | null,
	preset: ExportPreset,
	onProgress?: (status: string) => void
): Promise<void> {
	if (onProgress) onProgress("Preparing export canvas...");

	const totalW = Math.min(8192, preset.width);
	const totalH = Math.min(8192, preset.height);
	const cssW = Math.round(totalW / preset.scale);
	const cssH = Math.round(totalH / preset.scale);

	const container = document.createElement("div");
	container.style.position = "absolute";
	container.style.top = "-99999px";
	container.style.left = "-99999px";
	container.style.width = `${cssW}px`;
	container.style.height = `${cssH}px`;
	container.style.overflow = "hidden";
	document.body.appendChild(container);

	const styleUrl = `https://basemaps.cartocdn.com/gl/${settings.basemap}-gl-style/style.json`;

	if (onProgress) onProgress("Rendering basemap and fog...");

	const ml = (maplibregl as any).default || maplibregl;
	const exportMap = new ml.Map({
		container,
		style: styleUrl,
		center: liveMap.getCenter(),
		zoom: liveMap.getZoom(),
		bearing: liveMap.getBearing(),
		pitch: liveMap.getPitch(),
		pixelRatio: preset.scale,
		preserveDrawingBuffer: true,
		interactive: false,
		attributionControl: false
	});

	const exportFogLayer = new FogLayer(settings, dataset);

	await new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error("Export render timed out after 30 seconds"));
		}, 30000);

		exportMap.on("load", () => {
			exportMap.addLayer(exportFogLayer);
			exportMap.once("idle", () => {
				clearTimeout(timeout);
				resolve();
			});
		});
	});

	if (onProgress) onProgress("Compositing overlay...");

	const glCanvas = exportMap.getCanvas();
	const outCanvas = document.createElement("canvas");
	outCanvas.width = glCanvas.width;
	outCanvas.height = glCanvas.height;

	const ctx = outCanvas.getContext("2d");
	if (!ctx) {
		exportMap.remove();
		container.remove();
		throw new Error("Could not acquire 2D canvas context for export");
	}

	ctx.drawImage(glCanvas, 0, 0);
	drawOverlay(ctx, settings, stats, outCanvas.width, outCanvas.height, preset.scale);

	if (onProgress) onProgress("Generating PNG...");

	await new Promise<void>((resolve) => {
		outCanvas.toBlob((blob) => {
			if (blob) {
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `fog-of-war-${preset.id}-${new Date().toISOString().slice(0, 10)}.png`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
			resolve();
		}, "image/png");
	});

	exportMap.remove();
	container.remove();
	if (onProgress) onProgress("Export complete!");
}
