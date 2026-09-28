import type { DatasetStats, Settings } from "../types";

export function drawOverlay(
	ctx: CanvasRenderingContext2D,
	settings: Settings,
	stats: DatasetStats | null,
	width: number,
	height: number,
	scale: number
): void {
	const pad = 36 * scale;

	if (settings.frame) {
		const borderThick = 8 * scale;
		const borderThin = 4 * scale;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = borderThick;
		ctx.strokeRect(pad / 2, pad / 2, width - pad, height - pad);
	}

	const isLight =
		settings.basemap.startsWith("positron") || settings.fogColor.toLowerCase() > "#aaaaaa";
	const textColor = isLight ? "#131218" : "#ffffff";
	const subColor = isLight ? "#4b5563" : "#9ca3af";

	if (settings.title) {
		ctx.save();
		ctx.textAlign = "left";
		ctx.textBaseline = "top";

		ctx.font = `900 ${28 * scale}px Poppins, sans-serif`;
		ctx.fillStyle = textColor;
		ctx.fillText(settings.title, pad, pad);

		if (settings.subtitle) {
			ctx.font = `600 ${14 * scale}px Roboto, sans-serif`;
			ctx.fillStyle = subColor;
			ctx.fillText(settings.subtitle, pad, pad + 38 * scale);
		}
		ctx.restore();
	}

	if (settings.showStats && stats) {
		ctx.save();
		ctx.textAlign = "left";
		ctx.textBaseline = "bottom";

		const statParts: string[] = [];
		if (settings.statFields.distance) {
			const distStr = Math.round(stats.totalDistanceKm).toLocaleString();
			statParts.push(`${distStr} km`);
		}
		if (settings.statFields.places) {
			statParts.push(`${stats.uniquePlaces} places`);
		}
		if (settings.statFields.timeRange && stats.timeSpanYears > 0) {
			statParts.push(`${stats.timeSpanYears.toFixed(1)} years`);
		}

		if (statParts.length > 0) {
			ctx.font = `700 ${13 * scale}px Roboto, monospace`;
			ctx.fillStyle = subColor;
			ctx.fillText(statParts.join("   ·   "), pad, height - pad);
		}
		ctx.restore();
	}

	ctx.save();
	ctx.textAlign = "right";
	ctx.textBaseline = "bottom";
	ctx.font = `500 ${10 * scale}px Roboto, sans-serif`;
	ctx.fillStyle = isLight ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.6)";
	ctx.fillText(
		"© CARTO · © OpenStreetMap contributors · koeni.dev/projects/fogofwar",
		width - pad,
		height - pad
	);
	ctx.restore();
}
