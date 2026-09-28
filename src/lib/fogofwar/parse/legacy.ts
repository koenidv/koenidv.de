import { ACTIVITY_TYPES, VISIT_TYPES, type Dataset } from "../types";
import { parseLatLng } from "./latlng";
import { createEmptyDataset } from "../model/dataset";
import { parseAndroidTimeline } from "./androidTimeline";

export function parseRecords(root: any): Dataset {
	const locations = root.locations || [];
	const count = locations.length;
	if (count === 0) return createEmptyDataset();

	const lon = new Float64Array(count);
	const lat = new Float64Array(count);
	const t = new Float64Array(count);
	const fixAccuracy = new Float32Array(count);

	let minLon = 180,
		maxLon = -180,
		minLat = 90,
		maxLat = -90;
	let tMin = Infinity,
		tMax = -Infinity;

	let valid = 0;
	for (let i = 0; i < count; i++) {
		const loc = locations[i];
		const ll = parseLatLng(loc);
		if (!ll) continue;

		const [pLat, pLon] = ll;
		const pTime = loc.timestamp
			? typeof loc.timestamp === "number"
				? loc.timestamp
				: Date.parse(loc.timestamp)
			: 0;

		lon[valid] = pLon;
		lat[valid] = pLat;
		t[valid] = pTime;
		fixAccuracy[valid] = loc.accuracy || 0;

		if (pLat < minLat) minLat = pLat;
		if (pLat > maxLat) maxLat = pLat;
		if (pLon < minLon) minLon = pLon;
		if (pLon > maxLon) maxLon = pLon;
		if (pTime < tMin) tMin = pTime;
		if (pTime > tMax) tMax = pTime;
		valid++;
	}

	const segOffset = new Uint32Array([0, valid]);
	const segKind = new Uint8Array([0]);
	const segMode = new Uint8Array([0]);
	const segT0 = new Float64Array([tMin]);
	const segT1 = new Float64Array([tMax]);
	const segDist = new Float32Array([0]);

	return {
		lon: lon.subarray(0, valid),
		lat: lat.subarray(0, valid),
		t: t.subarray(0, valid),
		segOffset,
		segKind,
		segMode,
		segT0,
		segT1,
		segDist,
		visitLon: new Float64Array(0),
		visitLat: new Float64Array(0),
		visitT0: new Float64Array(0),
		visitT1: new Float64Array(0),
		visitType: new Uint8Array(0),
		placeIds: [],
		fixLon: lon.subarray(0, valid),
		fixLat: lat.subarray(0, valid),
		fixT: t.subarray(0, valid),
		fixAccuracy: fixAccuracy.subarray(0, valid),
		meta: {
			segCount: valid > 0 ? 1 : 0,
			pointCount: valid,
			visitCount: 0,
			fixCount: valid,
			tMin: Number.isFinite(tMin) ? tMin : 0,
			tMax: Number.isFinite(tMax) ? tMax : 0,
			bbox: [minLon, minLat, maxLon, maxLat]
		}
	};
}

export function parseSemanticHistory(files: any[]): Dataset {
	let totalObjs = 0;
	for (const f of files) {
		if (Array.isArray(f.timelineObjects)) {
			totalObjs += f.timelineObjects.length;
		}
	}
	if (totalObjs === 0) return createEmptyDataset();

	const syntheticSegments: any[] = [];
	for (const f of files) {
		for (const obj of f.timelineObjects || []) {
			if (obj.activitySegment) {
				const act = obj.activitySegment;
				syntheticSegments.push({
					startTime: act.duration?.startTimestamp,
					endTime: act.duration?.endTimestamp,
					activity: {
						start: { latLng: act.startLocation },
						end: { latLng: act.endLocation },
						distanceMeters: act.distance,
						topCandidate: { type: act.activityType }
					},
					timelinePath: act.waypointPath?.waypoints?.map((w: any) => ({
						point: `${w.latE7 / 1e7}°, ${w.lngE7 / 1e7}°`,
						time: act.duration?.startTimestamp
					}))
				});
			} else if (obj.placeVisit) {
				const vis = obj.placeVisit;
				syntheticSegments.push({
					startTime: vis.duration?.startTimestamp,
					endTime: vis.duration?.endTimestamp,
					visit: {
						placeLocation: vis.location,
						topCandidate: {
							semanticType: vis.location?.semanticType,
							placeId: vis.location?.placeId
						}
					}
				});
			}
		}
	}

	return parseAndroidTimeline({ semanticSegments: syntheticSegments, rawSignals: [] });
}
