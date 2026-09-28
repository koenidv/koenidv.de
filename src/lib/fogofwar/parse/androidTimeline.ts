import { ACTIVITY_TYPES, VISIT_TYPES, type Dataset, type DatasetMeta } from "../types";
import { parseLatLng } from "./latlng";
import { interpolateGreatCircle } from "../model/dataset";

export function parseAndroidTimeline(
	root: any,
	onProgress?: (processed: number, total: number) => void
): Dataset {
	const segments = root.semanticSegments || [];
	const rawSignals = root.rawSignals || [];
	const totalSegments = segments.length;

	let segCount = 0;
	let rawPointCount = 0;
	let visitCount = 0;
	let fixCount = 0;

	for (let i = 0; i < totalSegments; i++) {
		const s = segments[i];
		if (s.timelinePath) {
			segCount++;
			rawPointCount += s.timelinePath.length;
		} else if (s.activity) {
			segCount++;
			rawPointCount += 2;
		}
		if (s.visit) {
			visitCount++;
		}
	}

	for (let i = 0; i < rawSignals.length; i++) {
		if (rawSignals[i].position) {
			fixCount++;
		}
	}

	const totalAllocatedPoints = rawPointCount;

	const lon = new Float64Array(totalAllocatedPoints);
	const lat = new Float64Array(totalAllocatedPoints);
	const t = new Float64Array(totalAllocatedPoints);

	const segOffset = new Uint32Array(segCount + 1);
	const segKind = new Uint8Array(segCount);
	const segMode = new Uint8Array(segCount);
	const segT0 = new Float64Array(segCount);
	const segT1 = new Float64Array(segCount);
	const segDist = new Float32Array(segCount);

	const visitLon = new Float64Array(visitCount);
	const visitLat = new Float64Array(visitCount);
	const visitT0 = new Float64Array(visitCount);
	const visitT1 = new Float64Array(visitCount);
	const visitType = new Uint8Array(visitCount);
	const placeIds: string[] = new Array(visitCount);

	const fixLon = new Float64Array(fixCount);
	const fixLat = new Float64Array(fixCount);
	const fixT = new Float64Array(fixCount);
	const fixAccuracy = new Float32Array(fixCount);

	let ptIdx = 0;
	let segIdx = 0;
	let visIdx = 0;
	let fixIdx = 0;

	let minLon = 180;
	let maxLon = -180;
	let minLat = 90;
	let maxLat = -90;
	let tMin = Infinity;
	let tMax = -Infinity;

	function updateBbox(pLat: number, pLon: number) {
		if (!Number.isFinite(pLat) || !Number.isFinite(pLon)) return;
		if (pLat < minLat) minLat = pLat;
		if (pLat > maxLat) maxLat = pLat;
		if (pLon < minLon) minLon = pLon;
		if (pLon > maxLon) maxLon = pLon;
	}

	function updateTime(tMs: number) {
		if (!Number.isFinite(tMs)) return;
		if (tMs < tMin) tMin = tMs;
		if (tMs > tMax) tMax = tMs;
	}

	for (let i = 0; i < totalSegments; i++) {
		if (i > 0 && i % 5000 === 0 && onProgress) {
			onProgress(i, totalSegments);
		}

		const s = segments[i];
		const sT0 = s.startTime ? Date.parse(s.startTime) : NaN;
		const sT1 = s.endTime ? Date.parse(s.endTime) : sT0;
		if (Number.isFinite(sT0)) updateTime(sT0);
		if (Number.isFinite(sT1)) updateTime(sT1);

		if (s.timelinePath) {
			const path = s.timelinePath;
			const startPt = ptIdx;
			segOffset[segIdx] = startPt;
			segKind[segIdx] = 0;
			segMode[segIdx] = 0;
			segT0[segIdx] = sT0;
			segT1[segIdx] = sT1;
			segDist[segIdx] = 0;

			for (let p = 0; p < path.length; p++) {
				const pt = path[p];
				const ll = parseLatLng(pt.point);
				const ptLat = ll ? ll[0] : 0;
				const ptLon = ll ? ll[1] : 0;
				const ptTime = pt.time
					? Date.parse(pt.time)
					: sT0 + (p / Math.max(1, path.length - 1)) * (sT1 - sT0);

				lon[ptIdx] = ptLon;
				lat[ptIdx] = ptLat;
				t[ptIdx] = ptTime;

				if (ll) updateBbox(ptLat, ptLon);
				if (Number.isFinite(ptTime)) updateTime(ptTime);
				ptIdx++;
			}
			segIdx++;
		} else if (s.activity) {
			const act = s.activity;
			const startPt = ptIdx;
			segOffset[segIdx] = startPt;
			segKind[segIdx] = 1;

			const modeStr = act.topCandidate?.type || "";
			const modeIndex = (ACTIVITY_TYPES as readonly string[]).indexOf(modeStr);
			segMode[segIdx] = modeIndex >= 0 ? modeIndex : 0;
			segT0[segIdx] = sT0;
			segT1[segIdx] = sT1;
			segDist[segIdx] = act.distanceMeters || 0;

			const startLL = parseLatLng(act.start?.latLng);
			const endLL = parseLatLng(act.end?.latLng);
			const startLat = startLL ? startLL[0] : 0;
			const startLon = startLL ? startLL[1] : 0;
			const endLat = endLL ? endLL[0] : startLat;
			const endLon = endLL ? endLL[1] : startLon;

			if (startLL) updateBbox(startLat, startLon);
			if (endLL) updateBbox(endLat, endLon);

			lon[ptIdx] = startLon;
			lat[ptIdx] = startLat;
			t[ptIdx] = sT0;
			ptIdx++;

			lon[ptIdx] = endLon;
			lat[ptIdx] = endLat;
			t[ptIdx] = sT1;
			ptIdx++;
			segIdx++;
		}

		if (s.visit) {
			const vis = s.visit;
			const vLoc = parseLatLng(
				vis.topCandidate?.placeLocation?.latLng ||
					vis.placeLocation?.latLng ||
					vis.topCandidate?.placeLocation ||
					vis.placeLocation
			);
			const vLat = vLoc ? vLoc[0] : 0;
			const vLon = vLoc ? vLoc[1] : 0;

			visitLat[visIdx] = vLat;
			visitLon[visIdx] = vLon;
			visitT0[visIdx] = sT0;
			visitT1[visIdx] = sT1;

			const vTypeStr = vis.topCandidate?.semanticType || "";
			const vTypeIdx = (VISIT_TYPES as readonly string[]).indexOf(vTypeStr);
			visitType[visIdx] = vTypeIdx >= 0 ? vTypeIdx : 0;
			placeIds[visIdx] = vis.topCandidate?.placeId || vis.placeId || "";

			if (vLoc) updateBbox(vLat, vLon);
			visIdx++;
		}
	}

	segOffset[segIdx] = ptIdx;

	for (let i = 0; i < rawSignals.length; i++) {
		const pos = rawSignals[i].position;
		if (pos) {
			const ll = parseLatLng(pos.LatLng || pos.latLng);
			const pLat = ll ? ll[0] : 0;
			const pLon = ll ? ll[1] : 0;
			const pTime = pos.timestamp ? Date.parse(pos.timestamp) : 0;

			fixLat[fixIdx] = pLat;
			fixLon[fixIdx] = pLon;
			fixT[fixIdx] = pTime;
			fixAccuracy[fixIdx] = pos.accuracyMeters || 0;

			if (ll) updateBbox(pLat, pLon);
			if (Number.isFinite(pTime)) updateTime(pTime);
			fixIdx++;
		}
	}

	if (onProgress) {
		onProgress(totalSegments, totalSegments);
	}

	const meta: DatasetMeta = {
		segCount,
		pointCount: rawPointCount,
		visitCount,
		fixCount,
		tMin: Number.isFinite(tMin) ? tMin : 0,
		tMax: Number.isFinite(tMax) ? tMax : 0,
		bbox: [minLon, minLat, maxLon, maxLat]
	};

	return {
		lon,
		lat,
		t,
		segOffset,
		segKind,
		segMode,
		segT0,
		segT1,
		segDist,
		visitLon,
		visitLat,
		visitT0,
		visitT1,
		visitType,
		placeIds,
		fixLon,
		fixLat,
		fixT,
		fixAccuracy,
		meta
	};
}
