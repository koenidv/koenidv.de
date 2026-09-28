import { unzipSync, strFromU8 } from "fflate";
import { detectFormat } from "./detect";
import { parseAndroidTimeline } from "./androidTimeline";
import { parseRecords, parseSemanticHistory } from "./legacy";
import type { Dataset } from "../types";

self.onmessage = async (e: MessageEvent) => {
	const file: File = e.data.file || e.data;
	if (!file) {
		self.postMessage({ type: "error", message: "No file provided" });
		return;
	}

	try {
		const arrayBuf = await file.arrayBuffer();
		const bytes = new Uint8Array(arrayBuf);

		let jsonData: any = null;

		if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
			self.postMessage({ type: "progress", stage: "unzipping", processed: 0, total: 100 });
			const unzipped = unzipSync(bytes);
			const fileNames = Object.keys(unzipped);

			const nonMeta = fileNames.filter(
				(name) =>
					!name.endsWith("Settings.json") &&
					!name.endsWith("Encrypted Backups.txt") &&
					!name.endsWith("/") &&
					!name.startsWith("__MACOSX")
			);

			if (nonMeta.length === 0) {
				self.postMessage({ type: "encryptedBackupsOnly" });
				return;
			}

			const jsonFiles = nonMeta.filter((name) => name.endsWith(".json"));
			if (jsonFiles.length === 0) {
				self.postMessage({
					type: "error",
					message: "No location history JSON files found in the archive"
				});
				return;
			}

			if (jsonFiles.length === 1) {
				const text = strFromU8(unzipped[jsonFiles[0]]);
				jsonData = JSON.parse(text);
			} else {
				const parsedList: any[] = [];
				for (const jf of jsonFiles) {
					try {
						const t = strFromU8(unzipped[jf]);
						parsedList.push(JSON.parse(t));
					} catch {}
				}
				const detected = detectFormat(parsedList);
				if (detected.kind === "semanticHistory") {
					const dataset = parseSemanticHistory(parsedList);
					sendDataset(dataset);
					return;
				}
				jsonData = parsedList[0];
			}
		} else {
			self.postMessage({ type: "progress", stage: "reading", processed: 0, total: 100 });
			const text = new TextDecoder().decode(bytes);
			jsonData = JSON.parse(text);
		}

		const detected = detectFormat(jsonData);
		let dataset: Dataset;

		if (detected.kind === "android") {
			dataset = parseAndroidTimeline(detected.root, (processed, total) => {
				self.postMessage({
					type: "progress",
					stage: "parsing",
					processed,
					total
				});
			});
		} else if (detected.kind === "ios") {
			dataset = parseAndroidTimeline(
				{ semanticSegments: detected.root, rawSignals: [] },
				(processed, total) => {
					self.postMessage({
						type: "progress",
						stage: "parsing",
						processed,
						total
					});
				}
			);
		} else if (detected.kind === "records") {
			dataset = parseRecords(detected.root);
		} else if (detected.kind === "semanticHistory") {
			dataset = parseSemanticHistory(detected.files);
		} else if (detected.kind === "encryptedBackupsOnly") {
			self.postMessage({ type: "encryptedBackupsOnly" });
			return;
		} else {
			self.postMessage({
				type: "error",
				message: detected.hint || "Unrecognized location history format"
			});
			return;
		}

		sendDataset(dataset);
	} catch (err: any) {
		self.postMessage({
			type: "error",
			message: err?.message || "Failed to process location history file"
		});
	}
};

function sendDataset(dataset: Dataset) {
	const rawBuffers = [
		dataset.lon.buffer,
		dataset.lat.buffer,
		dataset.t.buffer,
		dataset.segOffset.buffer,
		dataset.segKind.buffer,
		dataset.segMode.buffer,
		dataset.segT0.buffer,
		dataset.segT1.buffer,
		dataset.segDist.buffer,
		dataset.visitLon.buffer,
		dataset.visitLat.buffer,
		dataset.visitT0.buffer,
		dataset.visitT1.buffer,
		dataset.visitType.buffer,
		dataset.fixLon.buffer,
		dataset.fixLat.buffer,
		dataset.fixT.buffer,
		dataset.fixAccuracy.buffer
	];

	const transferList = Array.from(new Set(rawBuffers.filter((b) => b && b.byteLength > 0)));

	self.postMessage(
		{
			type: "success",
			dataset
		},
		transferList
	);
}
