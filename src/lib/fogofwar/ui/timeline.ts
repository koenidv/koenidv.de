import type { Store } from "../store";
import type { DatasetMeta, DatasetStats, Settings } from "../types";

export function renderTimeline(
	container: HTMLElement,
	store: Store<Settings>,
	meta: DatasetMeta,
	stats: DatasetStats | null
): () => void {
	const tMin = meta.tMin;
	const tMax = meta.tMax;
	const span = Math.max(1, tMax - tMin);

	container.innerHTML = `
		<div class="w-full max-w-4xl mx-auto bg-beige-100 border-l-4 border-t-4 border-r-2 border-b-2 border-black elevated-card elevated-2 p-3 flex flex-col space-y-2">
			<div class="flex items-center justify-between text-xs font-mono">
				<div class="flex items-center space-x-2">
					<button id="timeline-play-btn" class="w-8 h-8 flex items-center justify-center bg-mojito-500 hover:bg-[#b0f550] border-2 border-black font-bold text-sm leading-none transition-transform active:translate-y-0.5">
						▶
					</button>
					<span id="timeline-date-display" class="font-bold text-[#131218]">2016-07 → 2026-09</span>
				</div>
				<div class="flex items-center space-x-2">
					<span class="text-gray-600 hidden sm:inline">Speed:</span>
					<button id="timeline-speed-btn" class="px-2 py-1 bg-white border border-black font-bold text-xs">
						1x
					</button>
					<button id="timeline-reset-btn" class="px-2 py-1 bg-white border border-black font-bold text-xs">
						All Time
					</button>
				</div>
			</div>

			<div class="relative w-full h-10 bg-white border border-black select-none">
				<canvas id="timeline-histogram-canvas" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>
				<input type="range" id="timeline-slider-max" min="0" max="1000" value="1000" class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10" />
				<div id="timeline-fill-bar" class="absolute top-0 bottom-0 left-0 bg-mojito-500/40 pointer-events-none border-r-2 border-black"></div>
			</div>
		</div>
	`;

	const playBtn = container.querySelector("#timeline-play-btn") as HTMLButtonElement;
	const dateDisplay = container.querySelector("#timeline-date-display") as HTMLElement;
	const speedBtn = container.querySelector("#timeline-speed-btn") as HTMLButtonElement;
	const resetBtn = container.querySelector("#timeline-reset-btn") as HTMLButtonElement;
	const sliderMax = container.querySelector("#timeline-slider-max") as HTMLInputElement;
	const fillBar = container.querySelector("#timeline-fill-bar") as HTMLElement;
	const canvas = container.querySelector("#timeline-histogram-canvas") as HTMLCanvasElement;

	function formatDate(ms: number): string {
		if (!Number.isFinite(ms) || ms <= 0) return "";
		const d = new Date(ms);
		return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
	}

	function updateDateDisplay(curMax: number) {
		const startStr = formatDate(tMin);
		const endStr = formatDate(curMax);
		dateDisplay.textContent = `${startStr} → ${endStr}`;
		const ratio = Math.max(0, Math.min(1, (curMax - tMin) / span));
		fillBar.style.width = `${ratio * 100}%`;
		sliderMax.value = String(Math.round(ratio * 1000));
	}

	function drawHistogram() {
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.scale(dpr, dpr);

		if (!stats || !stats.yearCounts) return;
		const years = Object.keys(stats.yearCounts)
			.map(Number)
			.sort((a, b) => a - b);
		if (years.length === 0) return;

		let maxCount = 0;
		for (const y of years) {
			if (stats.yearCounts[y] > maxCount) maxCount = stats.yearCounts[y];
		}
		if (maxCount === 0) return;

		const minYear = years[0];
		const maxYear = years[years.length - 1];
		const totalYears = Math.max(1, maxYear - minYear + 1);
		const colW = rect.width / totalYears;

		ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
		for (let i = 0; i < totalYears; i++) {
			const yr = minYear + i;
			const count = stats.yearCounts[yr] || 0;
			const h = (count / maxCount) * (rect.height - 4);
			ctx.fillRect(i * colW + 1, rect.height - h, Math.max(1, colW - 2), h);
		}
	}

	requestAnimationFrame(drawHistogram);
	window.addEventListener("resize", drawHistogram);

	let speeds = [1, 5, 20];
	let speedIdx = 0;

	speedBtn.addEventListener("click", () => {
		speedIdx = (speedIdx + 1) % speeds.length;
		speedBtn.textContent = `${speeds[speedIdx]}x`;
	});

	resetBtn.addEventListener("click", () => {
		store.set({ tMin, tMax, playing: false });
		playBtn.textContent = "▶";
		updateDateDisplay(tMax);
	});

	sliderMax.addEventListener("input", () => {
		const frac = Number(sliderMax.value) / 1000;
		const currentMax = tMin + frac * span;
		updateDateDisplay(currentMax);
		store.set({ tMax: currentMax, playing: false });
		playBtn.textContent = "▶";
	});

	let animId: number | null = null;
	let lastAnimTime = performance.now();

	function playLoop(now: number) {
		const dt = (now - lastAnimTime) / 1000;
		lastAnimTime = now;

		const currentSettings = store.get();
		if (currentSettings.playing) {
			const totalAnimSeconds = 30 / speeds[speedIdx];
			const advanceMs = (span / totalAnimSeconds) * dt;
			let nextMax = currentSettings.tMax + advanceMs;

			if (nextMax >= tMax) {
				nextMax = tMin;
			}

			store.set({ tMax: nextMax });
			updateDateDisplay(nextMax);
			animId = requestAnimationFrame(playLoop);
		}
	}

	playBtn.addEventListener("click", () => {
		const isPlaying = !store.get().playing;
		store.set({ playing: isPlaying });
		playBtn.textContent = isPlaying ? "⏸" : "▶";

		if (isPlaying) {
			lastAnimTime = performance.now();
			if (store.get().tMax >= tMax) {
				store.set({ tMax: tMin });
			}
			animId = requestAnimationFrame(playLoop);
		} else if (animId) {
			cancelAnimationFrame(animId);
		}
	});

	const unsub = store.subscribe((s) => {
		if (s.tMax) {
			updateDateDisplay(s.tMax);
		}
	});

	return () => {
		if (animId) cancelAnimationFrame(animId);
		window.removeEventListener("resize", drawHistogram);
		unsub();
	};
}
