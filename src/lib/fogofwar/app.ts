import * as maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type { Dataset, DatasetStats, Settings } from "./types";
import { createStore } from "./store";
import { DEFAULT_SETTINGS } from "./render/palette";
import { FogLayer } from "./render/fogLayer";
import { computeDatasetStats } from "./model/stats";
import {
	loadDataset,
	saveDataset,
	clearDataset,
	getStoredSize,
	loadSettings,
	saveSettings
} from "./persist";
import { renderLanding } from "./ui/landing";
import { setupImporter } from "./ui/importer";
import { renderPanel } from "./ui/panel";
import { renderTimeline } from "./ui/timeline";

export async function initFogOfWar(): Promise<void> {
	const mapContainer = document.getElementById("fow-map");
	const landingOverlay = document.getElementById("fow-landing");
	const panelAside = document.getElementById("fow-panel");
	const timelineBar = document.getElementById("fow-timeline");
	const panelToggleBtn = document.getElementById("fow-panel-toggle");
	const panelToggleWrapper = document.getElementById("fow-panel-toggle-wrapper");

	if (!mapContainer || !landingOverlay || !panelAside || !timelineBar) {
		console.error("Fog of War container elements not found");
		return;
	}

	if (panelToggleBtn) {
		panelToggleBtn.addEventListener("click", () => {
			panelAside.classList.remove("hidden");
			if (panelToggleWrapper) panelToggleWrapper.classList.add("hidden");
			else panelToggleBtn.classList.add("hidden");
		});
	}

	const canvasTest = document.createElement("canvas");
	const glTest = canvasTest.getContext("webgl2");
	if (!glTest) {
		landingOverlay.innerHTML = `
			<div class="max-w-md p-6 bg-red-100 border-2 border-black elevated-card">
				<h2 class="text-xl font-poppins font-black text-red-900 mb-2">WebGL2 Required</h2>
				<p class="text-sm font-roboto">Fog of War relies on WebGL2 for instanced coverage computation. Your browser or GPU does not currently support WebGL2.</p>
			</div>
		`;
		landingOverlay.classList.remove("hidden");
		return;
	}

	const persistedSettings = loadSettings();
	const initialSettings: Settings = {
		...DEFAULT_SETTINGS,
		...(persistedSettings || {}),
		playing: false
	};

	const store = createStore<Settings>(initialSettings);
	let currentDataset: Dataset | null = null;
	let currentStats: DatasetStats | null = null;
	let fogLayer: FogLayer | null = null;
	let cleanupTimeline: (() => void) | null = null;
	let cleanupPanel: (() => void) | null = null;

	const ml = (maplibregl as any).default || maplibregl;
	const map = new ml.Map({
		container: "fow-map",
		style: `https://basemaps.cartocdn.com/gl/${store.get().basemap}-gl-style/style.json`,
		preserveDrawingBuffer: true,
		maxZoom: 16,
		dragRotate: false,
		pitch: 0,
		maxPitch: 0,
		attributionControl: { compact: false }
	});

	let currentBasemap = store.get().basemap;

	map.on("load", () => {
		fogLayer = new FogLayer(store.get(), currentDataset || undefined);
		map.addLayer(fogLayer);
	});

	store.subscribe((newSettings) => {
		saveSettings(newSettings);
		if (newSettings.basemap !== currentBasemap) {
			currentBasemap = newSettings.basemap;
			const styleUrl = `https://basemaps.cartocdn.com/gl/${newSettings.basemap}-gl-style/style.json`;
			map.setStyle(styleUrl);
			map.once("style.load", () => {
				if (fogLayer) {
					map.addLayer(fogLayer);
				}
			});
		} else if (fogLayer) {
			fogLayer.updateSettings(newSettings);
		}
	});

	const worker = new Worker(new URL("./parse/worker.ts", import.meta.url), {
		type: "module"
	});

	const landingUI = renderLanding(landingOverlay);

	function activateDataset(dataset: Dataset, save = true) {
		currentDataset = dataset;
		currentStats = computeDatasetStats(dataset);

		store.set({
			tMin: dataset.meta.tMin,
			tMax: dataset.meta.tMax
		});

		if (fogLayer) {
			fogLayer.uploadDataset(dataset);
		}

		if (dataset.meta.bbox) {
			const [minLon, minLat, maxLon, maxLat] = dataset.meta.bbox;
			if (minLon < maxLon && minLat < maxLat) {
				map.fitBounds(
					[
						[minLon, minLat],
						[maxLon, maxLat]
					],
					{ padding: 80, maxZoom: 14 }
				);
			}
		}

		landingOverlay.classList.add("hidden");
		panelAside.classList.remove("hidden");
		if (panelToggleWrapper) panelToggleWrapper.classList.add("hidden");
		else if (panelToggleBtn) panelToggleBtn.classList.add("hidden");
		timelineBar.classList.remove("hidden");

		if (cleanupPanel) cleanupPanel();
		cleanupPanel = renderPanel(
			panelAside,
			store,
			map,
			() => currentDataset,
			() => currentStats,
			async () => {
				await clearDataset();
				currentDataset = null;
				currentStats = null;
				landingOverlay.classList.remove("hidden");
				panelAside.classList.add("hidden");
				if (panelToggleWrapper) panelToggleWrapper.classList.add("hidden");
				else if (panelToggleBtn) panelToggleBtn.classList.add("hidden");
				timelineBar.classList.add("hidden");
				if (fogLayer) {
					fogLayer.uploadDataset({
						...dataset,
						meta: { ...dataset.meta, segCount: 0 },
						segOffset: new Uint32Array([0]),
						visitLat: new Float64Array(0),
						fixLat: new Float64Array(0)
					});
				}
			},
			() => {
				landingOverlay.classList.remove("hidden");
			},
			() => getStoredSize(),
			() => {
				if (panelToggleWrapper) panelToggleWrapper.classList.remove("hidden");
				else if (panelToggleBtn) panelToggleBtn.classList.remove("hidden");
			}
		);

		if (cleanupTimeline) cleanupTimeline();
		cleanupTimeline = renderTimeline(timelineBar, store, dataset.meta, currentStats);

		if (save) {
			saveDataset(dataset).catch((e) => console.warn("Failed to persist dataset:", e));
		}
	}

	setupImporter(landingUI.dropZone, landingUI.fileInput, worker, {
		onProgress: (stage, processed, total) => {
			landingUI.progressEl.classList.remove("hidden");
			landingUI.statusMessage.classList.add("hidden");
			const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
			landingUI.progressBar.style.width = `${pct}%`;
			landingUI.progressText.textContent = `${stage.toUpperCase()}: ${processed.toLocaleString()} / ${total.toLocaleString()} (${pct}%)`;
		},
		onEncryptedBackupsOnly: () => {
			landingUI.progressEl.classList.add("hidden");
			landingUI.statusMessage.classList.remove("hidden");
			landingUI.statusMessage.className =
				"mb-6 p-4 border-2 border-black bg-lavender-200 text-[#131218] text-sm";
			landingUI.statusMessage.innerHTML = `
				<p class="font-poppins font-black mb-1">Encrypted Backups Detected</p>
				<p class="font-roboto mb-2">This Google Takeout zip only contains <code class="font-mono bg-white px-1">Settings.json</code> and <code class="font-mono bg-white px-1">Encrypted Backups.txt</code>. Because on-device encryption is enabled, Google Takeout does not include your coordinates.</p>
				<p class="font-roboto font-bold">To export your full timeline, use the Google Maps mobile app:</p>
				<p class="font-roboto">Settings → Location → Location Services → Timeline → Export Timeline data.</p>
			`;
		},
		onError: (msg) => {
			landingUI.progressEl.classList.add("hidden");
			landingUI.statusMessage.classList.remove("hidden");
			landingUI.statusMessage.className =
				"mb-6 p-4 border-2 border-black bg-red-100 text-red-900 text-sm";
			landingUI.statusMessage.innerHTML = `<span class="font-bold">Error:</span> ${msg}`;
		},
		onSuccess: (dataset) => {
			landingUI.progressEl.classList.add("hidden");
			activateDataset(dataset, true);
		}
	});

	const cached = await loadDataset();
	if (cached) {
		activateDataset(cached, false);
	}
}

if (typeof window !== "undefined") {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => initFogOfWar());
	} else {
		initFogOfWar();
	}
}
