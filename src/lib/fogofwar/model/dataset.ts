import type { Dataset, DatasetMeta } from "../types";

export function interpolateGreatCircle(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
	numPoints = 64
): Array<[number, number]> {
	const d2r = Math.PI / 180;
	const r2d = 180 / Math.PI;
	const phi1 = lat1 * d2r;
	const lam1 = lon1 * d2r;
	const phi2 = lat2 * d2r;
	const lam2 = lon2 * d2r;

	const x1 = Math.cos(phi1) * Math.cos(lam1);
	const y1 = Math.cos(phi1) * Math.sin(lam1);
	const z1 = Math.sin(phi1);

	const x2 = Math.cos(phi2) * Math.cos(lam2);
	const y2 = Math.cos(phi2) * Math.sin(lam2);
	const z2 = Math.sin(phi2);

	const dot = Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2));
	const omega = Math.acos(dot);
	const sinOmega = Math.sin(omega);

	const points: Array<[number, number]> = [];
	for (let i = 0; i < numPoints; i++) {
		const f = i / (numPoints - 1);
		if (sinOmega < 1e-6) {
			points.push([lat1 + f * (lat2 - lat1), lon1 + f * (lon2 - lon1)]);
		} else {
			const a = Math.sin((1 - f) * omega) / sinOmega;
			const b = Math.sin(f * omega) / sinOmega;
			const x = a * x1 + b * x2;
			const y = a * y1 + b * y2;
			const z = a * z1 + b * z2;
			const lat = Math.atan2(z, Math.hypot(x, y)) * r2d;
			const lon = Math.atan2(y, x) * r2d;
			points.push([lat, lon]);
		}
	}
	return points;
}

export function createEmptyDataset(): Dataset {
	return {
		lon: new Float64Array(0),
		lat: new Float64Array(0),
		t: new Float64Array(0),
		segOffset: new Uint32Array(1),
		segKind: new Uint8Array(0),
		segMode: new Uint8Array(0),
		segT0: new Float64Array(0),
		segT1: new Float64Array(0),
		segDist: new Float32Array(0),
		visitLon: new Float64Array(0),
		visitLat: new Float64Array(0),
		visitT0: new Float64Array(0),
		visitT1: new Float64Array(0),
		visitType: new Uint8Array(0),
		placeIds: [],
		fixLon: new Float64Array(0),
		fixLat: new Float64Array(0),
		fixT: new Float64Array(0),
		fixAccuracy: new Float32Array(0),
		meta: {
			segCount: 0,
			pointCount: 0,
			visitCount: 0,
			fixCount: 0,
			tMin: 0,
			tMax: 0,
			bbox: [0, 0, 0, 0]
		}
	};
}
