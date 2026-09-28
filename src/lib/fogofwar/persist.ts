import type { Dataset } from "./types";

const DB_NAME = "fogofwar_db";
const STORE_NAME = "dataset_store";
const CURRENT_KEY = "current";
const SCHEMA_VERSION = 1;

interface PersistedRecord {
	version: number;
	importedAt: number;
	meta: Dataset["meta"];
	placeIds: string[];
	lon: ArrayBuffer;
	lat: ArrayBuffer;
	t: ArrayBuffer;
	segOffset: ArrayBuffer;
	segKind: ArrayBuffer;
	segMode: ArrayBuffer;
	segT0: ArrayBuffer;
	segT1: ArrayBuffer;
	segDist: ArrayBuffer;
	visitLon: ArrayBuffer;
	visitLat: ArrayBuffer;
	visitT0: ArrayBuffer;
	visitT1: ArrayBuffer;
	visitType: ArrayBuffer;
	fixLon: ArrayBuffer;
	fixLat: ArrayBuffer;
	fixT: ArrayBuffer;
	fixAccuracy: ArrayBuffer;
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, SCHEMA_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function saveDataset(dataset: Dataset): Promise<void> {
	const db = await openDB();
	const record: PersistedRecord = {
		version: SCHEMA_VERSION,
		importedAt: Date.now(),
		meta: dataset.meta,
		placeIds: dataset.placeIds,
		lon: dataset.lon.buffer.slice(
			dataset.lon.byteOffset,
			dataset.lon.byteOffset + dataset.lon.byteLength
		),
		lat: dataset.lat.buffer.slice(
			dataset.lat.byteOffset,
			dataset.lat.byteOffset + dataset.lat.byteLength
		),
		t: dataset.t.buffer.slice(dataset.t.byteOffset, dataset.t.byteOffset + dataset.t.byteLength),
		segOffset: dataset.segOffset.buffer.slice(
			dataset.segOffset.byteOffset,
			dataset.segOffset.byteOffset + dataset.segOffset.byteLength
		),
		segKind: dataset.segKind.buffer.slice(
			dataset.segKind.byteOffset,
			dataset.segKind.byteOffset + dataset.segKind.byteLength
		),
		segMode: dataset.segMode.buffer.slice(
			dataset.segMode.byteOffset,
			dataset.segMode.byteOffset + dataset.segMode.byteLength
		),
		segT0: dataset.segT0.buffer.slice(
			dataset.segT0.byteOffset,
			dataset.segT0.byteOffset + dataset.segT0.byteLength
		),
		segT1: dataset.segT1.buffer.slice(
			dataset.segT1.byteOffset,
			dataset.segT1.byteOffset + dataset.segT1.byteLength
		),
		segDist: dataset.segDist.buffer.slice(
			dataset.segDist.byteOffset,
			dataset.segDist.byteOffset + dataset.segDist.byteLength
		),
		visitLon: dataset.visitLon.buffer.slice(
			dataset.visitLon.byteOffset,
			dataset.visitLon.byteOffset + dataset.visitLon.byteLength
		),
		visitLat: dataset.visitLat.buffer.slice(
			dataset.visitLat.byteOffset,
			dataset.visitLat.byteOffset + dataset.visitLat.byteLength
		),
		visitT0: dataset.visitT0.buffer.slice(
			dataset.visitT0.byteOffset,
			dataset.visitT0.byteOffset + dataset.visitT0.byteLength
		),
		visitT1: dataset.visitT1.buffer.slice(
			dataset.visitT1.byteOffset,
			dataset.visitT1.byteOffset + dataset.visitT1.byteLength
		),
		visitType: dataset.visitType.buffer.slice(
			dataset.visitType.byteOffset,
			dataset.visitType.byteOffset + dataset.visitType.byteLength
		),
		fixLon: dataset.fixLon.buffer.slice(
			dataset.fixLon.byteOffset,
			dataset.fixLon.byteOffset + dataset.fixLon.byteLength
		),
		fixLat: dataset.fixLat.buffer.slice(
			dataset.fixLat.byteOffset,
			dataset.fixLat.byteOffset + dataset.fixLat.byteLength
		),
		fixT: dataset.fixT.buffer.slice(
			dataset.fixT.byteOffset,
			dataset.fixT.byteOffset + dataset.fixT.byteLength
		),
		fixAccuracy: dataset.fixAccuracy.buffer.slice(
			dataset.fixAccuracy.byteOffset,
			dataset.fixAccuracy.byteOffset + dataset.fixAccuracy.byteLength
		)
	};

	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		store.put(record, CURRENT_KEY);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function loadDataset(): Promise<Dataset | null> {
	try {
		const db = await openDB();
		const record = await new Promise<PersistedRecord | undefined>((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readonly");
			const store = tx.objectStore(STORE_NAME);
			const req = store.get(CURRENT_KEY);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});

		if (!record || record.version !== SCHEMA_VERSION) {
			return null;
		}

		return {
			lon: new Float64Array(record.lon),
			lat: new Float64Array(record.lat),
			t: new Float64Array(record.t),
			segOffset: new Uint32Array(record.segOffset),
			segKind: new Uint8Array(record.segKind),
			segMode: new Uint8Array(record.segMode),
			segT0: new Float64Array(record.segT0),
			segT1: new Float64Array(record.segT1),
			segDist: new Float32Array(record.segDist),
			visitLon: new Float64Array(record.visitLon),
			visitLat: new Float64Array(record.visitLat),
			visitT0: new Float64Array(record.visitT0),
			visitT1: new Float64Array(record.visitT1),
			visitType: new Uint8Array(record.visitType),
			placeIds: record.placeIds || [],
			fixLon: new Float64Array(record.fixLon),
			fixLat: new Float64Array(record.fixLat),
			fixT: new Float64Array(record.fixT),
			fixAccuracy: new Float32Array(record.fixAccuracy),
			meta: record.meta
		};
	} catch (e) {
		console.warn("Failed to load cached dataset:", e);
		return null;
	}
}

export async function clearDataset(): Promise<void> {
	try {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readwrite");
			const store = tx.objectStore(STORE_NAME);
			store.delete(CURRENT_KEY);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	} catch (e) {
		console.warn("Failed to clear cached dataset:", e);
	}
}

export async function getStoredSize(): Promise<number> {
	try {
		const db = await openDB();
		const record = await new Promise<PersistedRecord | undefined>((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readonly");
			const store = tx.objectStore(STORE_NAME);
			const req = store.get(CURRENT_KEY);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});

		if (!record) return 0;

		return (
			record.lon.byteLength +
			record.lat.byteLength +
			record.t.byteLength +
			record.segOffset.byteLength +
			record.segKind.byteLength +
			record.segMode.byteLength +
			record.segT0.byteLength +
			record.segT1.byteLength +
			record.segDist.byteLength +
			record.visitLon.byteLength +
			record.visitLat.byteLength +
			record.visitT0.byteLength +
			record.visitT1.byteLength +
			record.visitType.byteLength +
			record.fixLon.byteLength +
			record.fixLat.byteLength +
			record.fixT.byteLength +
			record.fixAccuracy.byteLength
		);
	} catch {
		return 0;
	}
}

const SETTINGS_STORAGE_KEY = "fogofwar_settings";

export function saveSettings(settings: Settings): void {
	if (typeof window === "undefined" || !window.localStorage) return;
	try {
		const toSave = {
			...settings,
			playing: false
		};
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toSave));
	} catch (e) {
		console.warn("Failed to persist settings to localStorage:", e);
	}
}

export function loadSettings(): Partial<Settings> | null {
	if (typeof window === "undefined" || !window.localStorage) return null;
	try {
		const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === "object") {
			return parsed;
		}
	} catch (e) {
		console.warn("Failed to load settings from localStorage:", e);
	}
	return null;
}
