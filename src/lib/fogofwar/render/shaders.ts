export const COVERAGE_VS = `#version 300 es
precision highp float;

in vec2 a_corner;
in vec2 a_a;
in vec2 a_b;
in vec2 a_time;
in float a_mode;

uniform mat4 u_matrix;
uniform float u_tMin;
uniform float u_tMax;
uniform float u_radiusMetres;
uniform float u_visitRadiusMult;
uniform float u_modeRadius[16];
uniform float u_trailDays;
uniform float u_filterModes[16];
uniform float u_includeRawFixes;
uniform float u_featherPx;
uniform float u_mercPerPixel;

out vec2 v_pos;
out vec2 v_a;
out vec2 v_b;
out float v_radius;
out float v_feather;

const float PI = 3.14159265359;
const float EARTH_CIRCUM = 40075016.686;

float metresPerUnit(float y) {
	float lat = atan(sinh(PI * (1.0 - 2.0 * clamp(y, 0.0001, 0.9999))));
	return EARTH_CIRCUM * cos(lat);
}

void main() {
	if (a_time.y < u_tMin || a_time.x > u_tMax) {
		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
		return;
	}
	if (u_trailDays > 0.0 && a_time.y < (u_tMax - u_trailDays)) {
		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
		return;
	}

	int modeIdx = int(a_mode + 0.5);
	if (modeIdx < 16) {
		if (u_filterModes[modeIdx] < 0.5) {
			gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
			return;
		}
	} else if (modeIdx == 254) {
		if (u_includeRawFixes < 0.5) {
			gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
			return;
		}
	}

	float rM = u_radiusMetres;
	if (modeIdx < 16) {
		rM *= u_modeRadius[modeIdx];
	} else if (modeIdx == 255) {
		rM *= u_visitRadiusMult;
	}

	float mPerU = max(metresPerUnit(a_a.y), 1.0);
	float radiusMerc = rM / mPerU;
	float featherMerc = max(u_featherPx * u_mercPerPixel, 1e-6);
	float totalRadiusMerc = radiusMerc + featherMerc;

	vec2 dir = a_b - a_a;
	float len = length(dir);
	vec2 u = len > 1e-9 ? (dir / len) : vec2(1.0, 0.0);
	vec2 n = vec2(-u.y, u.x);
	vec2 center = 0.5 * (a_a + a_b);
	float halfLen = 0.5 * len;

	vec2 mercPos = center + u * (a_corner.x * (halfLen + totalRadiusMerc)) + n * (a_corner.y * totalRadiusMerc);
	gl_Position = u_matrix * vec4(mercPos, 0.0, 1.0);

	v_pos = mercPos;
	v_a = a_a;
	v_b = a_b;
	v_radius = radiusMerc;
	v_feather = featherMerc;
}
`;

export const COVERAGE_FS = `#version 300 es
precision highp float;

in vec2 v_pos;
in vec2 v_a;
in vec2 v_b;
in float v_radius;
in float v_feather;

out vec4 fragColor;

float segDist(vec2 p, vec2 a, vec2 b) {
	vec2 pa = p - a, ba = b - a;
	float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-12), 0.0, 1.0);
	return length(pa - ba * h);
}

void main() {
	float d = segDist(v_pos, v_a, v_b);
	float cov = 1.0 - smoothstep(max(0.0, v_radius - v_feather), v_radius, d);
	if (cov <= 0.0) discard;
	fragColor = vec4(cov, cov, cov, cov);
}
`;

export const FOG_VS = `#version 300 es
precision highp float;

out vec2 v_uv;

void main() {
	vec2 pos = vec2((gl_VertexID == 2) ? 3.0 : -1.0, (gl_VertexID == 1) ? 3.0 : -1.0);
	gl_Position = vec4(pos, 0.0, 1.0);
	v_uv = pos * 0.5 + 0.5;
}
`;

export const FOG_FS = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_coverageTexture;
uniform vec3 u_fogColor;
uniform float u_fogOpacity;
uniform vec3 u_rimColor;
uniform float u_rimStrength;
uniform float u_noiseAmount;
uniform float u_noiseScale;
uniform float u_driftSpeed;
uniform float u_time;
uniform float u_vignette;
uniform vec2 u_mercMin;
uniform vec2 u_mercMax;

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 4; i++) {
		v += a * noise(p);
		p *= 2.0;
		a *= 0.5;
	}
	return v;
}

void main() {
	float coverage = texture(u_coverageTexture, v_uv).r;
	float fog = 1.0 - coverage;

	vec2 drift = vec2(u_time * u_driftSpeed * 0.02, u_time * u_driftSpeed * 0.01);
	vec2 worldCoord = (u_mercMin + v_uv * (u_mercMax - u_mercMin)) * u_noiseScale * 800.0;
	float n = fbm(worldCoord + drift);

	fog = clamp(fog + (n - 0.5) * u_noiseAmount, 0.0, 1.0);

	float rim = smoothstep(0.35, 0.5, fog) * (1.0 - smoothstep(0.5, 0.75, fog));
	vec3 rgb = mix(u_fogColor, u_rimColor, rim * u_rimStrength);

	float dist = length(v_uv - 0.5) * 1.4142;
	float vig = smoothstep(0.5, 1.2, dist) * u_vignette;
	rgb = mix(rgb, vec3(0.0), vig * 0.7);

	float alpha = fog * u_fogOpacity;
	fragColor = vec4(rgb, alpha);
}
`;

export const TRACK_VS = `#version 300 es
precision highp float;

in vec2 a_corner;
in vec2 a_a;
in vec2 a_b;
in vec2 a_time;
in float a_mode;

uniform mat4 u_matrix;
uniform float u_tMin;
uniform float u_tMax;
uniform float u_trackWidthPx;
uniform float u_mercPerPixel;
uniform float u_trailDays;
uniform float u_filterModes[16];

out vec2 v_pos;
out vec2 v_a;
out vec2 v_b;
out float v_radius;
out float v_mode;

void main() {
	if (a_time.y < u_tMin || a_time.x > u_tMax) {
		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
		return;
	}
	if (u_trailDays > 0.0 && a_time.y < (u_tMax - u_trailDays)) {
		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
		return;
	}

	int modeIdx = int(a_mode + 0.5);
	if (modeIdx < 16 && u_filterModes[modeIdx] < 0.5) {
		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
		return;
	}

	float rMerc = max(u_trackWidthPx * u_mercPerPixel * 0.5, 1e-6);

	vec2 dir = a_b - a_a;
	float len = length(dir);
	vec2 u = len > 1e-9 ? (dir / len) : vec2(1.0, 0.0);
	vec2 n = vec2(-u.y, u.x);
	vec2 center = 0.5 * (a_a + a_b);
	float halfLen = 0.5 * len;

	vec2 mercPos = center + u * (a_corner.x * (halfLen + rMerc)) + n * (a_corner.y * rMerc);
	gl_Position = u_matrix * vec4(mercPos, 0.0, 1.0);

	v_pos = mercPos;
	v_a = a_a;
	v_b = a_b;
	v_radius = rMerc;
	v_mode = a_mode;
}
`;

export const TRACK_FS = `#version 300 es
precision highp float;

in vec2 v_pos;
in vec2 v_a;
in vec2 v_b;
in float v_radius;
in float v_mode;

uniform vec3 u_trackColor;
uniform float u_trackGlow;

out vec4 fragColor;

float segDist(vec2 p, vec2 a, vec2 b) {
	vec2 pa = p - a, ba = b - a;
	float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-12), 0.0, 1.0);
	return length(pa - ba * h);
}

void main() {
	float d = segDist(v_pos, v_a, v_b);
	if (d > v_radius) discard;
	float edge = 1.0 - smoothstep(v_radius * 0.5, v_radius, d);
	fragColor = vec4(u_trackColor, edge * (0.8 + u_trackGlow * 0.4));
}
`;
