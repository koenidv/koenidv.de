import type { Store } from "../store";
import type { Dataset, DatasetStats, Settings } from "../types";
import { PALETTES } from "../render/palette";
import { EXPORT_PRESETS, exportHighResPng } from "../export/png";
import type { Map } from "maplibre-gl";

export function renderPanel(
	container: HTMLElement,
	store: Store<Settings>,
	liveMap: Map,
	getDataset: () => Dataset | null,
	getStats: () => DatasetStats | null,
	onClearData: () => void,
	onReimport: () => void,
	storedSizeGetter: () => Promise<number>,
	onClose?: () => void
): () => void {
	container.innerHTML = `
		<div class="h-full flex flex-col bg-beige-100 border-l-4 border-t-4 border-r-2 border-b-2 border-black elevated-card elevated-2 overflow-hidden w-80 max-w-[calc(100vw-2rem)]">
			<div class="p-4 border-b-2 border-black flex items-center justify-between bg-beige-200">
				<div>
					<h2 class="text-lg font-poppins font-black uppercase tracking-wider text-[#131218]">Settings</h2>
					<div id="panel-stats-summary" class="text-xs font-mono text-gray-700">Loading stats...</div>
				</div>
				<button id="panel-collapse-btn" class="p-1 hover:bg-black/10 border border-black text-xs font-bold font-mono">
					✕
				</button>
			</div>

			<div class="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-roboto">
				<!-- Presets -->
				<div>
					<label class="block font-poppins font-black uppercase tracking-wider text-xs mb-2">Palettes</label>
					<div class="grid grid-cols-3 gap-1.5" id="panel-palette-btns">
						${Object.values(PALETTES)
							.map(
								(p) => `
							<button data-palette="${p.id}" class="py-1 px-2 border-l-2 border-t-2 border-r-1 border-b-1 border-black bg-white hover:bg-mojito-500 font-bold text-center transition-colors">
								${p.name}
							</button>
						`
							)
							.join("")}
					</div>
				</div>

				<!-- Basemap -->
				<div class="border-t border-black/20 pt-3">
					<label class="block font-poppins font-black uppercase tracking-wider text-xs mb-1">Basemap</label>
					<select id="setting-basemap" class="w-full bg-white border border-black p-1 font-semibold text-xs mb-2">
						<option value="dark-matter">CARTO Dark Matter</option>
						<option value="dark-matter-nolabels">Dark Matter (No Labels)</option>
						<option value="positron">CARTO Positron</option>
						<option value="positron-nolabels">Positron (No Labels)</option>
						<option value="voyager">CARTO Voyager</option>
					</select>
				</div>

				<!-- Fog & Reveal -->
				<div class="border-t border-black/20 pt-3 space-y-3">
					<label class="block font-poppins font-black uppercase tracking-wider text-xs">Fog & Reveal</label>

					<div class="flex items-center justify-between">
						<span class="font-semibold">Fog Color</span>
						<input type="color" id="setting-fog-color" class="w-8 h-6 border border-black cursor-pointer bg-transparent" />
					</div>

					<div class="flex items-center justify-between">
						<span class="font-semibold">Rim Glow</span>
						<input type="color" id="setting-rim-color" class="w-8 h-6 border border-black cursor-pointer bg-transparent" />
					</div>

					<div>
						<div class="flex justify-between mb-1">
							<span class="font-semibold">Reveal Radius</span>
							<span id="label-radius" class="font-mono text-[11px]">250 m</span>
						</div>
						<input type="range" id="setting-radius" min="1" max="100" value="50" class="w-full accent-black cursor-pointer" />
					</div>

					<div>
						<div class="flex justify-between mb-1">
							<span class="font-semibold">Edge Feather</span>
							<span id="label-feather" class="font-mono text-[11px]">12 px</span>
						</div>
						<input type="range" id="setting-feather" min="0" max="40" value="12" class="w-full accent-black cursor-pointer" />
					</div>

					<div>
						<div class="flex justify-between mb-1">
							<span class="font-semibold">Fog Density</span>
							<span id="label-opacity" class="font-mono text-[11px]">96%</span>
						</div>
						<input type="range" id="setting-opacity" min="10" max="100" value="96" class="w-full accent-black cursor-pointer" />
					</div>

					<div>
						<div class="flex justify-between mb-1">
							<span class="font-semibold">Fog Noise / Clouds</span>
							<span id="label-noise" class="font-mono text-[11px]">28%</span>
						</div>
						<input type="range" id="setting-noise" min="0" max="100" value="28" class="w-full accent-black cursor-pointer" />
					</div>

					<div>
						<div class="flex justify-between mb-1">
							<span class="font-semibold">Wind Drift Speed</span>
							<span id="label-drift" class="font-mono text-[11px]">8%</span>
						</div>
						<input type="range" id="setting-drift" min="0" max="100" value="8" class="w-full accent-black cursor-pointer" />
					</div>
				</div>

				<!-- Tracks & Overlay -->
				<div class="border-t border-black/20 pt-3 space-y-2">
					<label class="block font-poppins font-black uppercase tracking-wider text-xs">Tracks & Overlay</label>
					
					<label class="flex items-center space-x-2 cursor-pointer">
						<input type="checkbox" id="setting-show-tracks" class="accent-black cursor-pointer" />
						<span class="font-semibold">Draw Track Lines</span>
					</label>

					<div id="tracks-options" class="space-y-2 pl-4 border-l border-black/30">
						<div class="flex items-center justify-between">
							<span class="font-semibold">Track Color</span>
							<input type="color" id="setting-track-color" class="w-8 h-6 border border-black cursor-pointer bg-transparent" />
						</div>
						<div>
							<div class="flex justify-between mb-1">
								<span class="font-semibold">Width</span>
								<span id="label-track-width" class="font-mono text-[11px]">2 px</span>
							</div>
							<input type="range" id="setting-track-width" min="1" max="10" value="2" class="w-full accent-black cursor-pointer" />
						</div>
					</div>

					<label class="flex items-center space-x-2 cursor-pointer">
						<input type="checkbox" id="setting-raw-fixes" class="accent-black cursor-pointer" />
						<span class="font-semibold">Include Raw GPS Points</span>
					</label>

					<div class="pt-2 border-t border-black/10">
						<div class="flex justify-between mb-1">
							<span class="font-semibold">Max Path Gap</span>
							<span id="label-max-gap" class="font-mono text-[11px]">500 m</span>
						</div>
						<input type="range" id="setting-max-gap" min="1" max="100" value="50" class="w-full accent-black cursor-pointer" />
						<p class="text-[10px] text-gray-500 mt-0.5">Gaps larger than this are kept as isolated points rather than drawing straight lines.</p>
					</div>

					<label class="flex items-center space-x-2 cursor-pointer pt-1">
						<input type="checkbox" id="setting-connect-activities" class="accent-black cursor-pointer" />
						<span class="font-semibold">Connect Unknown Activities</span>
					</label>
				</div>

				<!-- Export -->
				<div class="border-t border-black/20 pt-3">
					<label class="block font-poppins font-black uppercase tracking-wider text-xs mb-2">Export Poster / Image</label>
					<div class="space-y-2">
						<select id="export-preset-select" class="w-full bg-white border border-black p-1 font-semibold text-xs">
							${EXPORT_PRESETS.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}
						</select>
						<div class="group w-full">
							<div class="elevated-card-hoverable elevated-1 w-full">
								<button id="btn-export-png" class="w-full py-2 bg-mojito-500 hover:bg-[#b0f550] text-black font-poppins font-black uppercase tracking-wider border-l-4 border-t-4 border-r-2 border-b-2 border-black flex items-center justify-center">
									<span class="group-hover:underline underline-offset-[0.2rem] decoration-[0.1rem]">Download High-Res PNG</span>
								</button>
							</div>
						</div>
						<div id="export-status-label" class="text-[11px] font-mono text-center text-gray-600 hidden"></div>
					</div>
				</div>

				<!-- Data & Storage -->
				<div class="border-t border-black/20 pt-3 space-y-2">
					<label class="block font-poppins font-black uppercase tracking-wider text-xs">Data & Storage</label>
					<div id="storage-size-label" class="text-[11px] font-mono text-gray-600">Stored: calculating...</div>
					<div class="flex space-x-2">
						<button id="btn-reimport" class="flex-1 py-1.5 px-2 bg-white hover:bg-gray-100 border border-black font-bold text-xs">
							New File
						</button>
						<button id="btn-clear-data" class="flex-1 py-1.5 px-2 bg-red-100 hover:bg-red-200 border border-black font-bold text-xs text-red-900">
							Clear Data
						</button>
					</div>
				</div>
			</div>
		</div>
	`;

	const s = store.get();

	// Elements
	const summaryEl = container.querySelector("#panel-stats-summary") as HTMLElement;
	const basemapSelect = container.querySelector("#setting-basemap") as HTMLSelectElement;
	const fogColorInput = container.querySelector("#setting-fog-color") as HTMLInputElement;
	const rimColorInput = container.querySelector("#setting-rim-color") as HTMLInputElement;
	const radiusSlider = container.querySelector("#setting-radius") as HTMLInputElement;
	const radiusLabel = container.querySelector("#label-radius") as HTMLElement;
	const featherSlider = container.querySelector("#setting-feather") as HTMLInputElement;
	const featherLabel = container.querySelector("#label-feather") as HTMLElement;
	const opacitySlider = container.querySelector("#setting-opacity") as HTMLInputElement;
	const opacityLabel = container.querySelector("#label-opacity") as HTMLElement;
	const noiseSlider = container.querySelector("#setting-noise") as HTMLInputElement;
	const noiseLabel = container.querySelector("#label-noise") as HTMLElement;
	const driftSlider = container.querySelector("#setting-drift") as HTMLInputElement;
	const driftLabel = container.querySelector("#label-drift") as HTMLElement;

	const showTracksCheckbox = container.querySelector("#setting-show-tracks") as HTMLInputElement;
	const trackColorInput = container.querySelector("#setting-track-color") as HTMLInputElement;
	const trackWidthSlider = container.querySelector("#setting-track-width") as HTMLInputElement;
	const trackWidthLabel = container.querySelector("#label-track-width") as HTMLElement;
	const tracksOptions = container.querySelector("#tracks-options") as HTMLElement;
	const rawFixesCheckbox = container.querySelector("#setting-raw-fixes") as HTMLInputElement;
	const maxGapSlider = container.querySelector("#setting-max-gap") as HTMLInputElement;
	const maxGapLabel = container.querySelector("#label-max-gap") as HTMLElement;
	const connectActivitiesCheckbox = container.querySelector(
		"#setting-connect-activities"
	) as HTMLInputElement;

	const exportPresetSelect = container.querySelector("#export-preset-select") as HTMLSelectElement;
	const exportBtn = container.querySelector("#btn-export-png") as HTMLButtonElement;
	const exportStatus = container.querySelector("#export-status-label") as HTMLElement;

	const storageLabel = container.querySelector("#storage-size-label") as HTMLElement;
	const clearBtn = container.querySelector("#btn-clear-data") as HTMLButtonElement;
	const reimportBtn = container.querySelector("#btn-reimport") as HTMLButtonElement;
	const collapseBtn = container.querySelector("#panel-collapse-btn") as HTMLButtonElement;

	// Log slider for radius: range 1..100 maps to 10..2000m
	function sliderToRadius(val: number): number {
		const minL = Math.log(10);
		const maxL = Math.log(2000);
		const t = (val - 1) / 99;
		return Math.round(Math.exp(minL + t * (maxL - minL)));
	}
	function radiusToSlider(r: number): number {
		const minL = Math.log(10);
		const maxL = Math.log(2000);
		const t = (Math.log(Math.max(10, Math.min(2000, r))) - minL) / (maxL - minL);
		return Math.round(1 + t * 99);
	}

	// Log slider for max path gap: range 1..100 maps to 50m..100,000m (100km)
	function sliderToGap(val: number): number {
		const minL = Math.log(50);
		const maxL = Math.log(100000);
		const t = (val - 1) / 99;
		const meters = Math.exp(minL + t * (maxL - minL));
		if (meters >= 10000) {
			return Math.round(meters / 1000) * 1000;
		} else if (meters >= 1000) {
			return Math.round(meters / 100) * 100;
		} else if (meters >= 200) {
			return Math.round(meters / 50) * 50;
		}
		return Math.round(meters / 10) * 10;
	}
	function gapToSlider(g: number): number {
		const minL = Math.log(50);
		const maxL = Math.log(100000);
		const t = (Math.log(Math.max(50, Math.min(100000, g))) - minL) / (maxL - minL);
		return Math.round(1 + t * 99);
	}

	function formatGap(meters: number): string {
		if (meters >= 1000) {
			const km = meters / 1000;
			return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
		}
		return `${meters} m`;
	}

	// Update stats display
	function refreshStatsDisplay() {
		const stats = getStats();
		if (stats) {
			const distStr = Math.round(stats.totalDistanceKm).toLocaleString();
			summaryEl.textContent = `${distStr} km · ${
				stats.uniquePlaces
			} places · ${stats.timeSpanYears.toFixed(1)} yrs`;
		} else {
			summaryEl.textContent = "";
		}
	}
	refreshStatsDisplay();

	// Update storage display
	storedSizeGetter().then((bytes) => {
		const mb = (bytes / (1024 * 1024)).toFixed(2);
		storageLabel.textContent = `Stored: ${mb} MB (IndexedDB)`;
	});

	// Synchronize controls with store state
	function syncUI(current: Settings) {
		basemapSelect.value = current.basemap;
		fogColorInput.value = current.fogColor;
		rimColorInput.value = current.rimColor;
		radiusSlider.value = String(radiusToSlider(current.radiusMetres));
		radiusLabel.textContent = `${current.radiusMetres} m`;
		featherSlider.value = String(current.featherPx);
		featherLabel.textContent = `${current.featherPx} px`;
		opacitySlider.value = String(Math.round(current.fogOpacity * 100));
		opacityLabel.textContent = `${Math.round(current.fogOpacity * 100)}%`;
		noiseSlider.value = String(Math.round(current.noiseAmount * 100));
		noiseLabel.textContent = `${Math.round(current.noiseAmount * 100)}%`;
		driftSlider.value = String(Math.round(current.driftSpeed * 100));
		driftLabel.textContent = `${Math.round(current.driftSpeed * 100)}%`;

		showTracksCheckbox.checked = current.showTracks;
		trackColorInput.value = current.trackColor;
		trackWidthSlider.value = String(current.trackWidthPx);
		trackWidthLabel.textContent = `${current.trackWidthPx} px`;
		tracksOptions.style.display = current.showTracks ? "block" : "none";

		rawFixesCheckbox.checked = current.includeRawFixes;
		maxGapSlider.value = String(gapToSlider(current.maxGapMetres));
		maxGapLabel.textContent = formatGap(current.maxGapMetres);
		connectActivitiesCheckbox.checked = current.connectActivities;
	}
	syncUI(s);

	// Wire change events
	basemapSelect.addEventListener("change", () => {
		store.set({ basemap: basemapSelect.value as any });
	});

	fogColorInput.addEventListener("input", () => {
		store.set({ fogColor: fogColorInput.value });
	});

	rimColorInput.addEventListener("input", () => {
		store.set({ rimColor: rimColorInput.value });
	});

	radiusSlider.addEventListener("input", () => {
		const r = sliderToRadius(Number(radiusSlider.value));
		radiusLabel.textContent = `${r} m`;
		store.set({ radiusMetres: r });
	});

	featherSlider.addEventListener("input", () => {
		const f = Number(featherSlider.value);
		featherLabel.textContent = `${f} px`;
		store.set({ featherPx: f });
	});

	opacitySlider.addEventListener("input", () => {
		const o = Number(opacitySlider.value) / 100;
		opacityLabel.textContent = `${opacitySlider.value}%`;
		store.set({ fogOpacity: o });
	});

	noiseSlider.addEventListener("input", () => {
		const n = Number(noiseSlider.value) / 100;
		noiseLabel.textContent = `${noiseSlider.value}%`;
		store.set({ noiseAmount: n });
	});

	driftSlider.addEventListener("input", () => {
		const d = Number(driftSlider.value) / 100;
		driftLabel.textContent = `${driftSlider.value}%`;
		store.set({ driftSpeed: d });
	});

	showTracksCheckbox.addEventListener("change", () => {
		tracksOptions.style.display = showTracksCheckbox.checked ? "block" : "none";
		store.set({ showTracks: showTracksCheckbox.checked });
	});

	trackColorInput.addEventListener("input", () => {
		store.set({ trackColor: trackColorInput.value });
	});

	trackWidthSlider.addEventListener("input", () => {
		const w = Number(trackWidthSlider.value);
		trackWidthLabel.textContent = `${w} px`;
		store.set({ trackWidthPx: w });
	});

	rawFixesCheckbox.addEventListener("change", () => {
		store.set({ includeRawFixes: rawFixesCheckbox.checked });
	});

	maxGapSlider.addEventListener("input", () => {
		const val = sliderToGap(Number(maxGapSlider.value));
		maxGapLabel.textContent = formatGap(val);
		store.set({ maxGapMetres: val });
	});

	connectActivitiesCheckbox.addEventListener("change", () => {
		store.set({ connectActivities: connectActivitiesCheckbox.checked });
	});

	// Presets
	const paletteBtns = container.querySelectorAll("[data-palette]");
	paletteBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			const pid = (btn as HTMLElement).dataset.palette;
			if (pid && PALETTES[pid]) {
				store.set(PALETTES[pid].patch);
			}
		});
	});

	// Export PNG
	exportBtn.addEventListener("click", async () => {
		const dataset = getDataset();
		if (!dataset) return;
		const presetId = exportPresetSelect.value;
		const preset = EXPORT_PRESETS.find((p) => p.id === presetId) || EXPORT_PRESETS[0];

		exportBtn.disabled = true;
		exportStatus.classList.remove("hidden");

		try {
			await exportHighResPng(liveMap, dataset, store.get(), getStats(), preset, (msg) => {
				exportStatus.textContent = msg;
			});
		} catch (err: any) {
			exportStatus.textContent = "Error: " + (err?.message || "Export failed");
		} finally {
			exportBtn.disabled = false;
			setTimeout(() => exportStatus.classList.add("hidden"), 4000);
		}
	});

	clearBtn.addEventListener("click", () => {
		if (confirm("Clear your imported location data from this browser?")) {
			onClearData();
		}
	});

	reimportBtn.addEventListener("click", onReimport);

	collapseBtn.addEventListener("click", () => {
		container.classList.add("hidden");
		if (onClose) onClose();
	});

	const unsubscribe = store.subscribe((newSettings) => {
		syncUI(newSettings);
		refreshStatsDisplay();
	});

	return unsubscribe;
}
