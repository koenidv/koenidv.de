import type { Dataset } from "../types";

export interface ImporterCallbacks {
	onProgress: (stage: string, processed: number, total: number) => void;
	onSuccess: (dataset: Dataset) => void;
	onError: (message: string) => void;
	onEncryptedBackupsOnly: () => void;
}

export function setupImporter(
	dropZoneEl: HTMLElement,
	fileInputEl: HTMLInputElement,
	worker: Worker,
	callbacks: ImporterCallbacks
): () => void {
	function handleFile(file: File) {
		if (!file) return;

		worker.onmessage = (e: MessageEvent) => {
			const data = e.data;
			if (data.type === "progress") {
				callbacks.onProgress(data.stage, data.processed, data.total);
			} else if (data.type === "encryptedBackupsOnly") {
				callbacks.onEncryptedBackupsOnly();
			} else if (data.type === "error") {
				callbacks.onError(data.message || "Failed to process location history file");
			} else if (data.type === "success") {
				callbacks.onSuccess(data.dataset);
			}
		};

		worker.postMessage({ file });
	}

	const onDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dropZoneEl.classList.add("border-mojito-500");
	};

	const onDragLeave = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dropZoneEl.classList.remove("border-mojito-500");
	};

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		dropZoneEl.classList.remove("border-mojito-500");
		if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			handleFile(e.dataTransfer.files[0]);
		}
	};

	const onChange = () => {
		if (fileInputEl.files && fileInputEl.files.length > 0) {
			handleFile(fileInputEl.files[0]);
		}
	};

	dropZoneEl.addEventListener("dragover", onDragOver);
	dropZoneEl.addEventListener("dragleave", onDragLeave);
	dropZoneEl.addEventListener("drop", onDrop);
	fileInputEl.addEventListener("change", onChange);

	return () => {
		dropZoneEl.removeEventListener("dragover", onDragOver);
		dropZoneEl.removeEventListener("dragleave", onDragLeave);
		dropZoneEl.removeEventListener("drop", onDrop);
		fileInputEl.removeEventListener("change", onChange);
	};
}
