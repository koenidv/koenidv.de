export type Detected =
	| { kind: "android"; root: any }
	| { kind: "ios"; root: any[] }
	| { kind: "records"; root: any }
	| { kind: "semanticHistory"; files: any[] }
	| { kind: "encryptedBackupsOnly" }
	| { kind: "unknown"; hint: string };

export function detectFormat(data: unknown): Detected {
	if (!data) {
		return { kind: "unknown", hint: "File is empty or could not be parsed" };
	}

	if (Array.isArray(data)) {
		if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
			const first = data[0];
			if (
				"startTime" in first ||
				"timelinePath" in first ||
				"activity" in first ||
				"visit" in first
			) {
				return { kind: "ios", root: data };
			}
		}
		return { kind: "unknown", hint: "Unrecognized array format" };
	}

	if (typeof data === "object") {
		const obj = data as Record<string, any>;
		if (Array.isArray(obj.semanticSegments)) {
			return { kind: "android", root: obj };
		}
		if (Array.isArray(obj.locations)) {
			return { kind: "records", root: obj };
		}
		if (Array.isArray(obj.timelineObjects)) {
			return { kind: "semanticHistory", files: [obj] };
		}
	}

	return { kind: "unknown", hint: "Unrecognized Timeline export format" };
}
