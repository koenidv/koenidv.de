import type { CustomLayerInterface, Map } from "maplibre-gl";
import type { Dataset, Settings } from "../types";
import { COVERAGE_VS, COVERAGE_FS, FOG_VS, FOG_FS, TRACK_VS, TRACK_FS } from "./shaders";
import { buildInstanceBuffer, lngLatToMercator } from "./buffers";

const CORNER_VERTICES = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace("#", "");
	if (clean.length === 3) {
		const r = parseInt(clean[0] + clean[0], 16) / 255;
		const g = parseInt(clean[1] + clean[1], 16) / 255;
		const b = parseInt(clean[2] + clean[2], 16) / 255;
		return [r, g, b];
	}
	const r = parseInt(clean.substring(0, 2), 16) / 255;
	const g = parseInt(clean.substring(2, 4), 16) / 255;
	const b = parseInt(clean.substring(4, 6), 16) / 255;
	return [Number.isFinite(r) ? r : 0, Number.isFinite(g) ? g : 0, Number.isFinite(b) ? b : 0];
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
	const shader = gl.createShader(type)!;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const err = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error("Shader compile error: " + err);
	}
	return shader;
}

function createProgram(
	gl: WebGL2RenderingContext,
	vsSource: string,
	fsSource: string
): WebGLProgram {
	const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
	const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
	const prog = gl.createProgram()!;
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		const err = gl.getProgramInfoLog(prog);
		gl.deleteProgram(prog);
		throw new Error("Program link error: " + err);
	}
	return prog;
}

export class FogLayer implements CustomLayerInterface {
	id = "fog-of-war-layer";
	type = "custom" as const;
	renderingMode = "2d" as const;

	private map: Map | null = null;
	private gl: WebGL2RenderingContext | null = null;
	private settings: Settings;
	private startTime = performance.now();

	private coverageProgram: WebGLProgram | null = null;
	private fogProgram: WebGLProgram | null = null;
	private trackProgram: WebGLProgram | null = null;

	private cornerBuffer: WebGLBuffer | null = null;
	private instanceBuffer: WebGLBuffer | null = null;
	private instanceCount = 0;

	private coverageVAO: WebGLVertexArrayObject | null = null;
	private fogVAO: WebGLVertexArrayObject | null = null;
	private trackVAO: WebGLVertexArrayObject | null = null;

	private coverageFbo: WebGLFramebuffer | null = null;
	private coverageTexture: WebGLTexture | null = null;
	private fboWidth = 0;
	private fboHeight = 0;

	private pendingDataset: Dataset | null = null;

	constructor(settings: Settings, initialDataset?: Dataset) {
		this.settings = settings;
		if (initialDataset) {
			this.pendingDataset = initialDataset;
		}
	}

	onAdd(map: Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
		if (!(gl instanceof WebGL2RenderingContext)) {
			console.error("WebGL2 is required for Fog of War layer.");
			return;
		}
		this.map = map;
		this.gl = gl;

		this.coverageProgram = createProgram(gl, COVERAGE_VS, COVERAGE_FS);
		this.fogProgram = createProgram(gl, FOG_VS, FOG_FS);
		this.trackProgram = createProgram(gl, TRACK_VS, TRACK_FS);

		this.cornerBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.cornerBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, CORNER_VERTICES, gl.STATIC_DRAW);

		this.instanceBuffer = gl.createBuffer();

		this.setupCoverageVAO(gl);
		this.setupFogVAO(gl);
		this.setupTrackVAO(gl);

		this.setupFBO(gl);

		if (this.pendingDataset) {
			this.uploadDataset(this.pendingDataset);
			this.pendingDataset = null;
		}
	}

	private setupCoverageVAO(gl: WebGL2RenderingContext): void {
		this.coverageVAO = gl.createVertexArray();
		gl.bindVertexArray(this.coverageVAO);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.cornerBuffer);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.vertexAttribDivisor(0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);

		// a_a: vec2
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 0);
		gl.vertexAttribDivisor(1, 1);

		// a_b: vec2
		gl.enableVertexAttribArray(2);
		gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 8);
		gl.vertexAttribDivisor(2, 1);

		// a_time: vec2
		gl.enableVertexAttribArray(3);
		gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 32, 16);
		gl.vertexAttribDivisor(3, 1);

		// a_mode: float
		gl.enableVertexAttribArray(4);
		gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 32, 24);
		gl.vertexAttribDivisor(4, 1);

		gl.bindVertexArray(null);
	}

	private setupFogVAO(gl: WebGL2RenderingContext): void {
		this.fogVAO = gl.createVertexArray();
	}

	private setupTrackVAO(gl: WebGL2RenderingContext): void {
		this.trackVAO = gl.createVertexArray();
		gl.bindVertexArray(this.trackVAO);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.cornerBuffer);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.vertexAttribDivisor(0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);

		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 0);
		gl.vertexAttribDivisor(1, 1);

		gl.enableVertexAttribArray(2);
		gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 8);
		gl.vertexAttribDivisor(2, 1);

		gl.enableVertexAttribArray(3);
		gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 32, 16);
		gl.vertexAttribDivisor(3, 1);

		gl.enableVertexAttribArray(4);
		gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 32, 24);
		gl.vertexAttribDivisor(4, 1);

		gl.bindVertexArray(null);
	}

	private setupFBO(gl: WebGL2RenderingContext): void {
		const targetW = Math.max(1, Math.floor(gl.canvas.width / 2));
		const targetH = Math.max(1, Math.floor(gl.canvas.height / 2));

		if (this.coverageFbo && this.fboWidth === targetW && this.fboHeight === targetH) {
			return;
		}

		if (this.coverageTexture) gl.deleteTexture(this.coverageTexture);
		if (this.coverageFbo) gl.deleteFramebuffer(this.coverageFbo);

		this.fboWidth = targetW;
		this.fboHeight = targetH;

		this.coverageTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.coverageTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA8,
			this.fboWidth,
			this.fboHeight,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			null
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		this.coverageFbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.coverageFbo);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			this.coverageTexture,
			0
		);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	private currentDataset: Dataset | null = null;

	uploadDataset(dataset: Dataset): void {
		this.currentDataset = dataset;
		if (!this.gl || !this.instanceBuffer) {
			this.pendingDataset = dataset;
			return;
		}
		const { buffer, count } = buildInstanceBuffer(dataset, this.settings);
		this.instanceCount = count;
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.STATIC_DRAW);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		if (this.map) this.map.triggerRepaint();
	}

	updateSettings(settings: Settings): void {
		const needRebuild =
			this.currentDataset &&
			(this.settings.connectActivities !== settings.connectActivities ||
				this.settings.maxGapMetres !== settings.maxGapMetres);

		this.settings = settings;

		if (needRebuild && this.currentDataset) {
			this.uploadDataset(this.currentDataset);
		} else if (this.map) {
			this.map.triggerRepaint();
		}
	}

	render(gl: WebGLRenderingContext | WebGL2RenderingContext, matrix: number[]): void {
		if (!(gl instanceof WebGL2RenderingContext)) return;
		if (!this.coverageProgram || !this.fogProgram || this.instanceCount === 0) return;

		const prevFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);
		const prevViewport = gl.getParameter(gl.VIEWPORT);

		this.setupFBO(gl);

		const zoom = this.map ? this.map.getZoom() : 10;
		const mercPerPixel = 1.0 / (512.0 * Math.pow(2.0, zoom));

		const EPOCH_2000 = 946684800000;
		const MS_PER_DAY = 86400000;
		const tMinDays = this.settings.tMin > 0 ? (this.settings.tMin - EPOCH_2000) / MS_PER_DAY : -1e9;
		const tMaxDays = this.settings.tMax > 0 ? (this.settings.tMax - EPOCH_2000) / MS_PER_DAY : 1e9;

		const filterModes = new Float32Array(16);
		for (let i = 0; i < 16; i++) {
			filterModes[i] = this.settings.enabledModes[i] ? 1.0 : 0.0;
		}

		const modeRadii = new Float32Array(16);
		for (let i = 0; i < 16; i++) {
			modeRadii[i] = this.settings.modeRadiusMult[i] || 1.0;
		}

		// PASS 1: Coverage
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.coverageFbo);
		gl.viewport(0, 0, this.fboWidth, this.fboHeight);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendEquation(gl.MAX);
		gl.blendFunc(gl.ONE, gl.ONE);

		gl.useProgram(this.coverageProgram);
		gl.uniformMatrix4fv(gl.getUniformLocation(this.coverageProgram, "u_matrix"), false, matrix);
		gl.uniform1f(gl.getUniformLocation(this.coverageProgram, "u_tMin"), tMinDays);
		gl.uniform1f(gl.getUniformLocation(this.coverageProgram, "u_tMax"), tMaxDays);
		gl.uniform1f(
			gl.getUniformLocation(this.coverageProgram, "u_radiusMetres"),
			this.settings.radiusMetres
		);
		gl.uniform1f(
			gl.getUniformLocation(this.coverageProgram, "u_visitRadiusMult"),
			this.settings.visitRadiusMult
		);
		gl.uniform1fv(gl.getUniformLocation(this.coverageProgram, "u_modeRadius"), modeRadii);
		gl.uniform1f(
			gl.getUniformLocation(this.coverageProgram, "u_trailDays"),
			this.settings.trailDays
		);
		gl.uniform1fv(gl.getUniformLocation(this.coverageProgram, "u_filterModes"), filterModes);
		gl.uniform1f(
			gl.getUniformLocation(this.coverageProgram, "u_includeRawFixes"),
			this.settings.includeRawFixes ? 1.0 : 0.0
		);
		gl.uniform1f(
			gl.getUniformLocation(this.coverageProgram, "u_featherPx"),
			this.settings.featherPx
		);
		gl.uniform1f(gl.getUniformLocation(this.coverageProgram, "u_mercPerPixel"), mercPerPixel);

		gl.bindVertexArray(this.coverageVAO);
		gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.instanceCount);

		// PASS 2: Fog Composite
		gl.bindFramebuffer(gl.FRAMEBUFFER, prevFBO);
		gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
		gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		gl.useProgram(this.fogProgram);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.coverageTexture);
		gl.uniform1i(gl.getUniformLocation(this.fogProgram, "u_coverageTexture"), 0);

		const fogRGB = hexToRgb(this.settings.fogColor);
		gl.uniform3f(
			gl.getUniformLocation(this.fogProgram, "u_fogColor"),
			fogRGB[0],
			fogRGB[1],
			fogRGB[2]
		);
		gl.uniform1f(gl.getUniformLocation(this.fogProgram, "u_fogOpacity"), this.settings.fogOpacity);

		const rimRGB = hexToRgb(this.settings.rimColor);
		gl.uniform3f(
			gl.getUniformLocation(this.fogProgram, "u_rimColor"),
			rimRGB[0],
			rimRGB[1],
			rimRGB[2]
		);
		gl.uniform1f(
			gl.getUniformLocation(this.fogProgram, "u_rimStrength"),
			this.settings.rimStrength
		);

		gl.uniform1f(
			gl.getUniformLocation(this.fogProgram, "u_noiseAmount"),
			this.settings.noiseAmount
		);
		gl.uniform1f(gl.getUniformLocation(this.fogProgram, "u_noiseScale"), this.settings.noiseScale);
		gl.uniform1f(gl.getUniformLocation(this.fogProgram, "u_driftSpeed"), this.settings.driftSpeed);

		const timeSec = (performance.now() - this.startTime) / 1000;
		gl.uniform1f(gl.getUniformLocation(this.fogProgram, "u_time"), timeSec);
		gl.uniform1f(gl.getUniformLocation(this.fogProgram, "u_vignette"), this.settings.vignette);

		if (this.map) {
			const bounds = this.map.getBounds();
			const sw = lngLatToMercator(bounds.getWest(), bounds.getSouth());
			const ne = lngLatToMercator(bounds.getEast(), bounds.getNorth());
			gl.uniform2f(gl.getUniformLocation(this.fogProgram, "u_mercMin"), sw.x, ne.y);
			gl.uniform2f(gl.getUniformLocation(this.fogProgram, "u_mercMax"), ne.x, sw.y);
		} else {
			gl.uniform2f(gl.getUniformLocation(this.fogProgram, "u_mercMin"), 0.0, 0.0);
			gl.uniform2f(gl.getUniformLocation(this.fogProgram, "u_mercMax"), 1.0, 1.0);
		}

		gl.bindVertexArray(this.fogVAO);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		// PASS 3: Track lines
		if (this.settings.showTracks && this.trackProgram && this.trackVAO) {
			gl.useProgram(this.trackProgram);
			gl.uniformMatrix4fv(gl.getUniformLocation(this.trackProgram, "u_matrix"), false, matrix);
			gl.uniform1f(gl.getUniformLocation(this.trackProgram, "u_tMin"), tMinDays);
			gl.uniform1f(gl.getUniformLocation(this.trackProgram, "u_tMax"), tMaxDays);
			gl.uniform1f(
				gl.getUniformLocation(this.trackProgram, "u_trackWidthPx"),
				this.settings.trackWidthPx
			);
			gl.uniform1f(gl.getUniformLocation(this.trackProgram, "u_mercPerPixel"), mercPerPixel);
			gl.uniform1f(
				gl.getUniformLocation(this.trackProgram, "u_trailDays"),
				this.settings.trailDays
			);
			gl.uniform1fv(gl.getUniformLocation(this.trackProgram, "u_filterModes"), filterModes);

			const trackRGB = hexToRgb(this.settings.trackColor);
			gl.uniform3f(
				gl.getUniformLocation(this.trackProgram, "u_trackColor"),
				trackRGB[0],
				trackRGB[1],
				trackRGB[2]
			);
			gl.uniform1f(
				gl.getUniformLocation(this.trackProgram, "u_trackGlow"),
				this.settings.trackGlow
			);

			gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
			gl.bindVertexArray(this.trackVAO);
			gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.instanceCount);
		}

		// Restore GL state
		gl.bindVertexArray(null);
		gl.useProgram(null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, prevFBO);
		gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
		gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		const prefersReducedMotion =
			typeof window !== "undefined" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		if (this.settings.driftSpeed > 0 && !prefersReducedMotion && this.map) {
			this.map.triggerRepaint();
		}
	}

	onRemove(map: Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
		if (!(gl instanceof WebGL2RenderingContext)) return;
		if (this.coverageProgram) gl.deleteProgram(this.coverageProgram);
		if (this.fogProgram) gl.deleteProgram(this.fogProgram);
		if (this.trackProgram) gl.deleteProgram(this.trackProgram);
		if (this.cornerBuffer) gl.deleteBuffer(this.cornerBuffer);
		if (this.instanceBuffer) gl.deleteBuffer(this.instanceBuffer);
		if (this.coverageVAO) gl.deleteVertexArray(this.coverageVAO);
		if (this.fogVAO) gl.deleteVertexArray(this.fogVAO);
		if (this.trackVAO) gl.deleteVertexArray(this.trackVAO);
		if (this.coverageTexture) gl.deleteTexture(this.coverageTexture);
		if (this.coverageFbo) gl.deleteFramebuffer(this.coverageFbo);
		this.map = null;
		this.gl = null;
	}
}
