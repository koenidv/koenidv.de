import type { Dataset, Settings } from "../types";

export function lngLatToMercator(lng: number, lat: number): { x: number; y: number } {
	const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
	const x = (lng + 180) / 360;
	const sin = Math.sin((clampedLat * Math.PI) / 180);
	const y = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
	return { x, y };
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const d2r = Math.PI / 180;
	const dLat = (lat2 - lat1) * d2r;
	const dLon = (lon2 - lon1) * d2r;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const EPOCH_2000 = 946684800000;
const MS_PER_DAY = 86400000;

export function buildInstanceBuffer(
	dataset: Dataset,
	settings?: Partial<Settings>
): { buffer: Float32Array; count: number } {
	const maxGapMetres = settings?.maxGapMetres ?? 500;
	const connectActivities = settings?.connectActivities ?? false;

	const segCount = dataset.meta.segCount;
	const visitCount = dataset.visitLat.length;
	const fixCount = dataset.fixLat.length;

	let subsegs = 0;
	for (let i = 0; i < segCount; i++) {
		const len = dataset.segOffset[i + 1] - dataset.segOffset[i];
		if (len > 1) {
			subsegs += len - 1;
		}
	}

	const maxAlloc = (subsegs * 2 + segCount * 2 + visitCount + fixCount) * 8;
	const out = new Float32Array(maxAlloc);

	let cursor = 0;

	for (let i = 0; i < segCount; i++) {
		const start = dataset.segOffset[i];
		const end = dataset.segOffset[i + 1];
		const isActivity = dataset.segKind[i] === 1;
		const mode = dataset.segMode[i];
		const segT0Days = (dataset.segT0[i] - EPOCH_2000) / MS_PER_DAY;
		const segT1Days = (dataset.segT1[i] - EPOCH_2000) / MS_PER_DAY;

		if (isActivity) {
			const m0 = lngLatToMercator(dataset.lon[start], dataset.lat[start]);
			const m1 = lngLatToMercator(dataset.lon[end - 1], dataset.lat[end - 1]);
			const dist = distanceMeters(
				dataset.lat[start],
				dataset.lon[start],
				dataset.lat[end - 1],
				dataset.lon[end - 1]
			);

			if (connectActivities && dist <= maxGapMetres) {
				out[cursor++] = m0.x;
				out[cursor++] = m0.y;
				out[cursor++] = m1.x;
				out[cursor++] = m1.y;
				out[cursor++] = Math.min(segT0Days, segT1Days);
				out[cursor++] = Math.max(segT0Days, segT1Days);
				out[cursor++] = mode;
				out[cursor++] = 0.0;
			} else {
				out[cursor++] = m0.x;
				out[cursor++] = m0.y;
				out[cursor++] = m0.x;
				out[cursor++] = m0.y;
				out[cursor++] = segT0Days;
				out[cursor++] = segT0Days;
				out[cursor++] = mode;
				out[cursor++] = 0.0;

				out[cursor++] = m1.x;
				out[cursor++] = m1.y;
				out[cursor++] = m1.x;
				out[cursor++] = m1.y;
				out[cursor++] = segT1Days;
				out[cursor++] = segT1Days;
				out[cursor++] = mode;
				out[cursor++] = 0.0;
			}
		} else {
			for (let p = start; p < end - 1; p++) {
				const m0 = lngLatToMercator(dataset.lon[p], dataset.lat[p]);
				const m1 = lngLatToMercator(dataset.lon[p + 1], dataset.lat[p + 1]);

				const t0 = dataset.t[p] > 0 ? (dataset.t[p] - EPOCH_2000) / MS_PER_DAY : segT0Days;
				const t1 = dataset.t[p + 1] > 0 ? (dataset.t[p + 1] - EPOCH_2000) / MS_PER_DAY : segT1Days;

				const stepDist = distanceMeters(
					dataset.lat[p],
					dataset.lon[p],
					dataset.lat[p + 1],
					dataset.lon[p + 1]
				);

				if (stepDist <= maxGapMetres) {
					out[cursor++] = m0.x;
					out[cursor++] = m0.y;
					out[cursor++] = m1.x;
					out[cursor++] = m1.y;
					out[cursor++] = Math.min(t0, t1);
					out[cursor++] = Math.max(t0, t1);
					out[cursor++] = mode;
					out[cursor++] = 0.0;
				} else {
					out[cursor++] = m0.x;
					out[cursor++] = m0.y;
					out[cursor++] = m0.x;
					out[cursor++] = m0.y;
					out[cursor++] = t0;
					out[cursor++] = t0;
					out[cursor++] = mode;
					out[cursor++] = 0.0;

					out[cursor++] = m1.x;
					out[cursor++] = m1.y;
					out[cursor++] = m1.x;
					out[cursor++] = m1.y;
					out[cursor++] = t1;
					out[cursor++] = t1;
					out[cursor++] = mode;
					out[cursor++] = 0.0;
				}
			}
		}
	}

	for (let v = 0; v < visitCount; v++) {
		const m = lngLatToMercator(dataset.visitLon[v], dataset.visitLat[v]);
		const t0 = (dataset.visitT0[v] - EPOCH_2000) / MS_PER_DAY;
		const t1 = (dataset.visitT1[v] - EPOCH_2000) / MS_PER_DAY;

		out[cursor++] = m.x;
		out[cursor++] = m.y;
		out[cursor++] = m.x;
		out[cursor++] = m.y;
		out[cursor++] = t0;
		out[cursor++] = t1;
		out[cursor++] = 255.0;
		out[cursor++] = 0.0;
	}

	for (let f = 0; f < fixCount; f++) {
		const m = lngLatToMercator(dataset.fixLon[f], dataset.fixLat[f]);
		const t = (dataset.fixT[f] - EPOCH_2000) / MS_PER_DAY;

		out[cursor++] = m.x;
		out[cursor++] = m.y;
		out[cursor++] = m.x;
		out[cursor++] = m.y;
		out[cursor++] = t;
		out[cursor++] = t;
		out[cursor++] = 254.0;
		out[cursor++] = 0.0;
	}

	const totalCount = cursor / 8;
	return { buffer: out.subarray(0, cursor), count: totalCount };
}
