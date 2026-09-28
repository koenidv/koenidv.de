export function parseLatLng(v: unknown): [number, number] | null {
	if (!v) return null;

	if (typeof v === "string") {
		const clean = v.replace(/°/g, "").trim();
		const parts = clean.split(/[,;\s]+/).filter(Boolean);
		if (parts.length >= 2) {
			const lat = parseFloat(parts[0]);
			const lon = parseFloat(parts[1]);
			if (
				Number.isFinite(lat) &&
				Number.isFinite(lon) &&
				Math.abs(lat) <= 90 &&
				Math.abs(lon) <= 180
			) {
				return [lat, lon];
			}
		}
		return null;
	}

	if (Array.isArray(v) && v.length >= 2) {
		const lat = Number(v[0]);
		const lon = Number(v[1]);
		if (
			Number.isFinite(lat) &&
			Number.isFinite(lon) &&
			Math.abs(lat) <= 90 &&
			Math.abs(lon) <= 180
		) {
			return [lat, lon];
		}
		return null;
	}

	if (typeof v === "object") {
		const obj = v as Record<string, unknown>;

		if (obj.LatLng) return parseLatLng(obj.LatLng);
		if (obj.latLng) return parseLatLng(obj.latLng);
		if (obj.placeLocation) return parseLatLng(obj.placeLocation);

		if (typeof obj.latitudeE7 === "number" && typeof obj.longitudeE7 === "number") {
			return [obj.latitudeE7 / 1e7, obj.longitudeE7 / 1e7];
		}

		const lat =
			typeof obj.lat === "number" ? obj.lat : typeof obj.latitude === "number" ? obj.latitude : NaN;
		const lon =
			typeof obj.lng === "number"
				? obj.lng
				: typeof obj.lon === "number"
				? obj.lon
				: typeof obj.longitude === "number"
				? obj.longitude
				: NaN;

		if (
			Number.isFinite(lat) &&
			Number.isFinite(lon) &&
			Math.abs(lat) <= 90 &&
			Math.abs(lon) <= 180
		) {
			return [lat, lon];
		}
	}

	return null;
}
