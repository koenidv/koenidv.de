import { ACTIVITY_TYPES, type Dataset, type DatasetStats } from "../types";

export function computeDatasetStats(dataset: Dataset): DatasetStats {
	const kmByMode: Record<string, number> = {};
	for (const mode of ACTIVITY_TYPES) {
		kmByMode[mode] = 0;
	}

	let totalDistanceKm = 0;
	const segCount = dataset.meta.segCount;

	for (let i = 0; i < segCount; i++) {
		const start = dataset.segOffset[i];
		const end = dataset.segOffset[i + 1];
		const modeIdx = dataset.segMode[i];
		const modeName = ACTIVITY_TYPES[modeIdx] || "UNKNOWN_ACTIVITY_TYPE";

		let distKm = 0;
		if (dataset.segDist[i] > 0) {
			distKm = dataset.segDist[i] / 1000;
		} else if (end - start > 1) {
			let polyDist = 0;
			for (let p = start; p < end - 1; p++) {
				polyDist += haversineKm(
					dataset.lat[p],
					dataset.lon[p],
					dataset.lat[p + 1],
					dataset.lon[p + 1]
				);
			}
			distKm = polyDist;
		}

		kmByMode[modeName] = (kmByMode[modeName] || 0) + distKm;
		totalDistanceKm += distKm;
	}

	const placeCounts = new Map<string, number>();
	for (const pid of dataset.placeIds) {
		if (pid) {
			placeCounts.set(pid, (placeCounts.get(pid) || 0) + 1);
		}
	}

	let frequentPlacesCount = 0;
	for (const count of placeCounts.values()) {
		if (count >= 3) frequentPlacesCount++;
	}

	const yearCounts: Record<number, number> = {};
	const totalPts = dataset.lon.length;
	for (let i = 0; i < totalPts; i += 5) {
		const t = dataset.t[i];
		if (t > 0) {
			const y = new Date(t).getUTCFullYear();
			if (y >= 2000 && y <= 2050) {
				yearCounts[y] = (yearCounts[y] || 0) + 5;
			}
		}
	}

	const spanMs = dataset.meta.tMax - dataset.meta.tMin;
	const timeSpanYears = spanMs > 0 ? spanMs / (365.25 * 86400000) : 0;

	return {
		totalDistanceKm,
		kmByMode,
		totalVisits: dataset.visitLat.length,
		uniquePlaces: placeCounts.size,
		frequentPlacesCount,
		yearCounts,
		timeSpanYears
	};
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const d2r = Math.PI / 180;
	const dLat = (lat2 - lat1) * d2r;
	const dLon = (lon2 - lon1) * d2r;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
