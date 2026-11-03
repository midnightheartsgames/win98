(function (S) {
  'use strict';
  const M = S.METRICS;
  const HEAD = '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2D;\nprecision highp sampler2DArray;\n';
  const LIGHT = 'const vec3 LIGHT = vec3(-0.3558, 0.8642, 0.3558);\n';
  const SEA = [0.11, 0.3, 0.5];
  const INSTANCE_BYTES = 16;
  const FLAGS_OFFSET = 14;
  const SHADOW_POWER = 0.62, HOUSE_SHADOW_POWER = 0.4, SHADOW_BIAS = 0.35, INDOOR_BIAS = 0.03;
  const SOFT_EDGE = [[0.18, 0], [-0.09, 0.156], [-0.09, -0.156]];
  const FIGURE_COLUMNS = 40, FIGURE_FRAMES = 5, FIGURE_DIRS = 8, FIGURE_CELLS = [24, 12], FIGURE_ANCHORS = [[12, 20], [6, 10]], FIGURE_PHASES = [0, 0.125, 0.375, 0.625, 0.875], FIGURE_SHAPES = ['adult', 'child', 'toddler'], FIGURE_STRIDE = 32;
  const FACE_SUPER = 3, FACE_TARGET = 256, FACE_YAW = -0.32, FACE_ZOOM = 1.12;
  const SKIN_LAYERS = 40, SKIN_LEVELS = 9, SIM_SHADOW_POWER = 0.3, MARK_ABOVE = 0.32, MARK_SIZE = 0.09, MARK_SPIN = 1.6;
  const SIM_SHADOW_BIT = 8, SIM_GHOST_BIT = 128, NO_PLANE = -1000, GHOST_MARGIN = 0.3, GHOST_ABOVE_LOW_WALL = 0.7, FIGURES_FROM = 3;
  const OUTDOOR_TEXEL = 0xF0;
  const DIM = '0.62', DIM_VALUE = 0.62;
  const LAST_TILE = M.town - 1;
  const LIGHT_LIMIT = '1.3';
  const STYLED = `
uniform sampler2D uStyle;
uniform sampler2DArray uPattern;
vec3 styled(vec3 base, float shade, vec2 uv, int ch, int row) {
  vec4 head = texelFetch(uStyle, ivec2(ch * ${S.Style.ROW_TEXELS}, row), 0);
  if (head.a < 0.5) return base;
  vec4 w = texelFetch(uPattern, ivec3(ivec2(uv * ${S.Style.SIZE}.0) & ${S.Style.SIZE - 1}, int(head.r * 255.0 + 0.5)), 0);
  vec3 c = texelFetch(uStyle, ivec2(ch * ${S.Style.ROW_TEXELS} + 1, row), 0).rgb * w.r;
  c += texelFetch(uStyle, ivec2(ch * ${S.Style.ROW_TEXELS} + 2, row), 0).rgb * w.g;
  c += texelFetch(uStyle, ivec2(ch * ${S.Style.ROW_TEXELS} + 3, row), 0).rgb * w.b;
  c += texelFetch(uStyle, ivec2(ch * ${S.Style.ROW_TEXELS} + 4, row), 0).rgb * w.a;
  return c * shade;
}
`;
  const LIT = `
uniform sampler2DArray uLight;
uniform vec3 uSky;
int roomAt(vec2 w, int layer) {
  vec4 t = texelFetch(uLight, ivec3(clamp(ivec2(floor(w)), ivec2(0), ivec2(${LAST_TILE})), layer), 0);
  return int(t.a * 255.0 + 0.5) & 15;
}
vec3 lightAt(vec2 w, int layer, int room) {
  vec2 q = w - 0.5;
  ivec2 b = ivec2(floor(q));
  vec2 f = q - vec2(b);
  vec3 sum = vec3(0.0);
  float total = 0.0;
  for (int j = 0; j < 2; j++) {
    for (int i = 0; i < 2; i++) {
      vec4 t = texelFetch(uLight, ivec3(clamp(b + ivec2(i, j), ivec2(0), ivec2(${LAST_TILE})), layer), 0);
      int a = int(t.a * 255.0 + 0.5);
      if ((a & 15) != room) continue;
      float k = (i == 0 ? 1.0 - f.x : f.x) * (j == 0 ? 1.0 - f.y : f.y);
      sum += k * (t.rgb * 2.0 + float(a >> 4) / 15.0 * uSky);
      total += k;
    }
  }
  return min(total > 0.0005 ? sum / total : uSky, vec3(${LIGHT_LIMIT}));
}
`;
  S.GLSL = { HEAD, LIGHT, STYLED, LIT };

  const TERRAIN_VS = HEAD + LIGHT + `
layout(location = 0) in ivec2 aGrid;
layout(location = 1) in ivec2 iChunk;
uniform mat4 uM;
uniform vec4 uTurn;
uniform int uStep;
uniform sampler2D uHeight;
uniform sampler2DArray uLight;
uniform vec3 uSky;
out vec2 vTile;
out float vShade;
out vec3 vLight;
float at(ivec2 g) { return texelFetch(uHeight, clamp(g, ivec2(0), ivec2(${M.town})), 0).r; }
void main() {
  ivec2 g = iChunk + aGrid;
  vec3 n = normalize(vec3(at(g - ivec2(uStep, 0)) - at(g + ivec2(uStep, 0)), 2.0 * float(uStep), at(g - ivec2(0, uStep)) - at(g + ivec2(0, uStep))));
  vec2 t = vec2(uTurn.x * n.x + uTurn.y * n.z, uTurn.z * n.x + uTurn.w * n.z);
  vShade = 0.64 + 0.42 * max(dot(vec3(t.x, n.y, t.y), LIGHT), 0.0);
  vTile = vec2(g);
  vec4 l = texelFetch(uLight, ivec3(clamp(g, ivec2(0), ivec2(${LAST_TILE})), 0), 0);
  int a = int(l.a * 255.0 + 0.5);
  vLight = min((a & 15) == 0 ? l.rgb * 2.0 + uSky : uSky, vec3(${LIGHT_LIMIT}));
  gl_Position = uM * vec4(float(g.x), at(g), float(g.y), 1.0);
}`;

  const TERRAIN_FS = HEAD + `
in vec2 vTile;
in float vShade;
in vec3 vLight;
uniform sampler2D uPaint;
uniform float uGrain;
out vec4 color;
void main() {
  vec3 c = texture(uPaint, vTile / ${M.town}.0).rgb;
  float n = fract(sin(dot(floor(vTile * uGrain), vec2(12.9898, 78.233))) * 43758.5453);
  color = vec4(c * vShade * (0.96 + 0.08 * n) * vLight, 1.0);
}`;

  const SPRITE_VS = HEAD + `
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec3 iPos;
layout(location = 2) in uint iKind;
layout(location = 3) in uint iFlags;
layout(location = 4) in uint iStyle;
uniform vec4 uTurn;
uniform vec4 uCam;
uniform vec2 uHalf;
uniform vec2 uSize;
uniform vec3 uDepth;
uniform int uZoom;
uniform int uRot;
uniform int uRowBase;
uniform float uRange;
uniform sampler2D uTable;
uniform sampler2DArray uLight;
flat out ivec2 vOrigin;
flat out ivec3 vAtlas;
flat out vec3 vDepth;
flat out int vShift;
flat out int vStyle;
flat out vec3 vPos;
flat out vec2 vAnchor;
flat out int vLayer;
flat out int vCut;
flat out float vDim;
flat out int vGlass;
flat out int vFacing;
void main() {
  int flags = int(iFlags);
  float rx = uTurn.x * iPos.x + uTurn.y * iPos.z;
  float rz = uTurn.z * iPos.x + uTurn.w * iPos.z;
  vec2 a = floor(vec2((rx - rz) * uCam.x * 0.5, (rx + rz) * uCam.x * 0.25 - iPos.y * uCam.y) + 0.5);
  int facing = flags & 3;
  int row = int(iKind) * ${S.SPRITE_ROWS} + uRowBase + uZoom * 4 + ((facing + uRot) & 3);
  ivec2 t = ivec2((row % ${S.ATLAS.ROWS_PER_LINE}) * ${S.ATLAS.ROW_TEXELS}, row / ${S.ATLAS.ROWS_PER_LINE});
  vec4 r0 = texelFetch(uTable, t, 0);
  vec4 r1 = texelFetch(uTable, t + ivec2(1, 0), 0);
  vec4 r2 = texelFetch(uTable, t + ivec2(2, 0), 0);
  vec2 anchor = a - uCam.zw + uHalf;
  vec2 o = anchor + r0.xy;
  vec2 p = o + aCorner * r0.zw;
  float d0 = -uDepth.x * (rx + rz) - uDepth.y * iPos.y - uDepth.z;
  vOrigin = ivec2(o);
  vAtlas = ivec3(r1.xyz);
  vShift = int(r1.w);
  vStyle = int(iStyle);
  vDepth = vec3(d0, r2.x, r2.y);
  vPos = iPos;
  vAnchor = anchor;
  vLayer = (flags >> 2) & 7;
  vCut = (flags >> 5) & 1;
  vDim = (flags & 128) != 0 ? ${DIM} : 1.0;
  vGlass = int(r2.z);
  vFacing = facing;
  if ((flags & 64) != 0) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    return;
  }
  float a8 = texelFetch(uLight, ivec3(clamp(ivec2(floor(iPos.xz)), ivec2(0), ivec2(${LAST_TILE})), vLayer), 0).a;
  float bias = (int(a8 * 255.0 + 0.5) & 15) == 0 ? ${SHADOW_BIAS} : ${INDOOR_BIAS};
  float plane = d0 - uDepth.x * 4.0 * (p.y - anchor.y) / uCam.x - bias;
  gl_Position = vec4(2.0 * p.x / uSize.x - 1.0, 1.0 - 2.0 * p.y / uSize.y, plane / uRange, 1.0);
}`;

  const SPRITE_FS = HEAD + STYLED + LIT + `
flat in ivec2 vOrigin;
flat in ivec3 vAtlas;
flat in vec3 vDepth;
flat in int vShift;
flat in int vStyle;
flat in vec3 vPos;
flat in vec2 vAnchor;
flat in int vLayer;
flat in int vCut;
flat in float vDim;
flat in int vGlass;
flat in int vFacing;
uniform sampler2DArray uColor;
uniform sampler2DArray uData;
uniform float uScreenH;
uniform float uRange;
uniform vec4 uTurn;
uniform vec2 uScale;
uniform vec2 uRecon;
out vec4 color;
const vec2 OUTSIDE[4] = vec2[4](vec2(0.0, -1.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(1.0, 0.0));
void main() {
  ivec2 screen = ivec2(int(gl_FragCoord.x), int(uScreenH - gl_FragCoord.y));
  ivec2 p = (screen - vOrigin) >> vShift;
  ivec3 t = ivec3(vAtlas.xy + p, vAtlas.z);
  vec4 c = texelFetch(uColor, t, 0);
  if (c.a < 0.5) discard;
  vec4 d = texelFetch(uData, t, 0);
  float rel = vDepth.y + d.a * vDepth.z;
  vec2 s = vec2(gl_FragCoord.x, uScreenH - gl_FragCoord.y) - vAnchor;
  float dy = -(s.y + rel * uRecon.x) / uRecon.y;
  if (vCut != 0 && dy > ${M.wallLow}) discard;
  int b = int(d.b * 255.0 + 0.5);
  bool glass = vGlass != 0 && (b & 3) == 3;
  if (glass && ((screen.x | screen.y) & 1) == 0) discard;
  gl_FragDepth = 0.5 + 0.5 * (vDepth.x + rel) / uRange;
  float sum = 4.0 * (s.y + dy * uScale.y) / uScale.x, diff = 2.0 * s.x / uScale.x;
  float rx = (sum + diff) * 0.5, rz = (sum - diff) * 0.5;
  vec2 w = vPos.xz + vec2(uTurn.x * rx + uTurn.z * rz, uTurn.y * rx + uTurn.w * rz);
  vec3 rgb = c.rgb;
  if (vStyle > 0) rgb = styled(rgb, float(b >> 2) / 40.0, d.rg, b & 3, vStyle);
  vec3 l;
  if (glass) {
    vec2 n = OUTSIDE[vFacing] * 0.5;
    vec3 outer = lightAt(w + n, vLayer, roomAt(w + n, vLayer)), inner = lightAt(w - n, vLayer, roomAt(w - n, vLayer));
    l = max(outer, inner);
    float glow = clamp(dot(inner - uSky, vec3(0.34)) * 2.0, 0.0, 1.0);
    rgb = mix(rgb, vec3(1.0, 0.86, 0.56), glow);
  } else {
    l = lightAt(w, vLayer, roomAt(w, vLayer));
  }
  color = vec4(rgb * l * vDim, 1.0);
}`;

  const SHADOW_FS = HEAD + LIT + `
flat in ivec2 vOrigin;
flat in ivec3 vAtlas;
flat in int vShift;
flat in float vDim;
flat in vec3 vPos;
flat in vec2 vAnchor;
flat in int vLayer;
uniform sampler2DArray uShadow;
uniform float uScreenH;
uniform float uPower;
uniform vec4 uTurn;
uniform float uTile;
out vec4 color;
void main() {
  ivec2 p = (ivec2(int(gl_FragCoord.x), int(uScreenH - gl_FragCoord.y)) - vOrigin) >> vShift;
  float a = texelFetch(uShadow, ivec3(vAtlas.xy + p, vAtlas.z), 0).r;
  if (a < 0.02) discard;
  vec2 s = vec2(gl_FragCoord.x, uScreenH - gl_FragCoord.y) - vAnchor;
  float sum = 4.0 * s.y / uTile, diff = 2.0 * s.x / uTile, rx = (sum + diff) * 0.5, rz = (sum - diff) * 0.5;
  vec2 w = vPos.xz + vec2(uTurn.x * rx + uTurn.z * rz, uTurn.y * rx + uTurn.w * rz);
  if (roomAt(w, vLayer) != roomAt(vPos.xz, vLayer)) discard;
  color = vec4(0.05, 0.07, 0.12, a * uPower * vDim);
}`;

  const HOUSE_VS = HEAD + LIGHT + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec3 aNormal;
layout(location = 3) in float aAo;
layout(location = 4) in uvec3 aInfo;
uniform mat4 uM;
uniform vec4 uTurn;
out vec3 vWorld;
out vec2 vUv;
out float vShade;
flat out int vRow;
flat out int vRoom;
flat out int vLayer;
void main() {
  vec2 t = vec2(uTurn.x * aNormal.x + uTurn.y * aNormal.z, uTurn.z * aNormal.x + uTurn.w * aNormal.z);
  vShade = (0.75 + 0.43 * max(dot(vec3(t.x, aNormal.y, t.y), LIGHT), 0.0)) * aAo * ((aInfo.z & 1u) != 0u ? ${DIM} : 1.0);
  vWorld = aPos;
  vUv = aUv;
  vRow = int(aInfo.x);
  vRoom = (aInfo.z & 2u) != 0u ? -1 : int(aInfo.y & 15u);
  vLayer = int(aInfo.y >> 4);
  gl_Position = uM * vec4(aPos, 1.0);
}`;

  const HOUSE_FS = HEAD + LIT + `
in vec3 vWorld;
in vec2 vUv;
in float vShade;
flat in int vRow;
flat in int vRoom;
flat in int vLayer;
uniform sampler2D uStyle;
uniform sampler2DArray uPattern;
out vec4 color;
void main() {
  float layer = texelFetch(uStyle, ivec2(0, vRow), 0).r * 255.0;
  vec4 w = texture(uPattern, vec3(vUv, layer));
  vec3 c = texelFetch(uStyle, ivec2(1, vRow), 0).rgb * w.r;
  c += texelFetch(uStyle, ivec2(2, vRow), 0).rgb * w.g;
  c += texelFetch(uStyle, ivec2(3, vRow), 0).rgb * w.b;
  c += texelFetch(uStyle, ivec2(4, vRow), 0).rgb * w.a;
  color = vec4(c * vShade * lightAt(vWorld.xz, vLayer, vRoom), 1.0);
}`;

  const HOUSE_SHADOW_VS = HEAD + LIGHT + `
layout(location = 0) in vec3 aPos;
uniform mat4 uM;
uniform vec4 uTurn;
uniform float uBase;
uniform float uBias;
uniform vec2 uOffset;
void main() {
  float up = max(aPos.y - uBase, 0.0), dx = -LIGHT.x / LIGHT.y * up, dz = -LIGHT.z / LIGHT.y * up;
  vec4 c = uM * vec4(aPos.x + uTurn.x * dx + uTurn.z * dz + uOffset.x, uBase, aPos.z + uTurn.y * dx + uTurn.w * dz + uOffset.y, 1.0);
  c.z -= uBias;
  gl_Position = c;
}`;

  const HOUSE_SHADOW_FS = HEAD + `
uniform float uPower;
out vec4 color;
void main() { color = vec4(0.05, 0.07, 0.12, uPower); }`;

  const SIM_VS = HEAD + LIGHT + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;
layout(location = 3) in uvec2 aBone;
layout(location = 4) in float aWeight;
uniform mat4 uM;
uniform vec4 uTurn;
uniform vec4 uBones[${S.Body.COUNT * 3}];
uniform float uPlane;
uniform float uBias;
out vec2 vUv;
out vec2 vWorld;
out float vShade;
out float vHeight;
flat out int vBone;
vec3 place(int b, vec4 q) { return vec3(dot(uBones[b * 3], q), dot(uBones[b * 3 + 1], q), dot(uBones[b * 3 + 2], q)); }
vec3 spin(int b, vec3 n) { return vec3(dot(uBones[b * 3].xyz, n), dot(uBones[b * 3 + 1].xyz, n), dot(uBones[b * 3 + 2].xyz, n)); }
void main() {
  int a = int(aBone.x), b = int(aBone.y);
  vec4 q = vec4(aPos, 1.0);
  vec3 p = mix(place(a, q), place(b, q), aWeight);
  vec3 n = normalize(mix(spin(a, aNormal), spin(b, aNormal), aWeight));
  vec2 t = vec2(uTurn.x * n.x + uTurn.y * n.z, uTurn.z * n.x + uTurn.w * n.z);
  vShade = 0.72 + 0.46 * max(dot(vec3(t.x, n.y, t.y), LIGHT), 0.0);
  vUv = aUv;
  vBone = a;
  vHeight = p.y;
  if (uPlane > -500.0) {
    float up = max(p.y - uPlane, 0.0), dx = -LIGHT.x / LIGHT.y * up, dz = -LIGHT.z / LIGHT.y * up;
    p = vec3(p.x + uTurn.x * dx + uTurn.z * dz, uPlane, p.z + uTurn.y * dx + uTurn.w * dz);
  }
  vWorld = p.xz;
  vec4 c = uM * vec4(p, 1.0);
  c.z -= uBias;
  gl_Position = c;
}`;

  const SIM_FS = HEAD + LIT + `
in vec2 vUv;
in vec2 vWorld;
in float vShade;
uniform sampler2DArray uSkin;
uniform float uSkinLayer;
uniform int uLayer;
uniform float uDim;
out vec4 color;
void main() {
  vec3 c = texture(uSkin, vec3(vUv, uSkinLayer), -1.0).rgb;
  color = vec4(c * vShade * lightAt(vWorld, uLayer, roomAt(vWorld, uLayer)) * uDim, 1.0);
}`;

  const FACE_FS = HEAD + `
in vec2 vUv;
in float vShade;
uniform sampler2DArray uSkin;
uniform float uSkinLayer;
out vec4 color;
void main() {
  color = vec4(texture(uSkin, vec3(vUv, uSkinLayer), -1.0).rgb * vShade, 1.0);
}`;

  const SIM_SHADOW_FS = HEAD + LIT + `
in vec2 vWorld;
uniform int uLayer;
uniform vec2 uFeet;
uniform float uPower;
out vec4 color;
void main() {
  if (roomAt(vWorld, uLayer) != roomAt(uFeet, uLayer)) discard;
  color = vec4(0.05, 0.07, 0.12, uPower);
}`;

  const SILHOUETTE_FS = HEAD + `
in float vHeight;
uniform float uFloorY;
out vec4 color;
void main() {
  if (vHeight < uFloorY) discard;
  color = vec4(0.2, 0.42, 1.0, 0.55);
}`;

  const FIGURE_ZONE = [3, 2, 2, 0, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 3, 3, 4, 4, 3, 3, 4, 4];
  const FIGURE_BAKE_FS = HEAD + `
flat in int vBone;
in float vShade;
uniform float uHairZone;
out vec4 color;
const int ZONE[24] = int[24](${FIGURE_ZONE.join(', ')});
void main() {
  float zone = uHairZone > 0.5 ? 1.0 : float(ZONE[vBone]);
  color = vec4(zone / 4.0, vShade / 1.5, 0.0, 1.0);
}`;

  const FIGURE_VS = HEAD + `
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec3 iPos;
layout(location = 2) in uint iFrame;
layout(location = 3) in vec4 iSkin;
layout(location = 4) in vec4 iHair;
layout(location = 5) in vec4 iShirt;
layout(location = 6) in vec4 iLegs;
uniform vec4 uTurn;
uniform vec4 uCam;
uniform vec2 uHalf;
uniform vec2 uSize;
uniform vec3 uDepth;
uniform float uRange;
uniform vec4 uCell;
flat out ivec2 vOrigin;
flat out ivec2 vAtlas;
flat out vec3 vSkin;
flat out vec3 vHair;
flat out vec3 vShirt;
flat out vec3 vLegs;
void main() {
  float rx = uTurn.x * iPos.x + uTurn.y * iPos.z, rz = uTurn.z * iPos.x + uTurn.w * iPos.z;
  vec2 a = floor(vec2((rx - rz) * uCam.x * 0.5, (rx + rz) * uCam.x * 0.25 - iPos.y * uCam.y) + 0.5);
  vec2 o = a - uCam.zw + uHalf - uCell.zw;
  vec2 p = o + aCorner * uCell.x;
  int f = int(iFrame);
  vOrigin = ivec2(o);
  vAtlas = ivec2((f % ${FIGURE_COLUMNS}) * int(uCell.x), int(uCell.y) + (f / ${FIGURE_COLUMNS}) * int(uCell.x));
  vSkin = iSkin.rgb;
  vHair = iHair.rgb;
  vShirt = iShirt.rgb;
  vLegs = iLegs.rgb;
  float d = -uDepth.x * (rx + rz) - uDepth.y * (iPos.y + 0.9) - uDepth.z;
  gl_Position = vec4(2.0 * p.x / uSize.x - 1.0, 1.0 - 2.0 * p.y / uSize.y, d / uRange, 1.0);
}`;

  const FIGURE_FS = HEAD + `
flat in ivec2 vOrigin;
flat in ivec2 vAtlas;
flat in vec3 vSkin;
flat in vec3 vHair;
flat in vec3 vShirt;
flat in vec3 vLegs;
uniform sampler2D uAtlas;
uniform float uScreenH;
uniform vec3 uSky;
uniform int uCellSize;
out vec4 color;
void main() {
  ivec2 p = ivec2(int(gl_FragCoord.x), int(uScreenH - gl_FragCoord.y)) - vOrigin;
  vec4 t = texelFetch(uAtlas, vAtlas + ivec2(p.x, uCellSize - 1 - p.y), 0);
  if (t.a < 0.5) discard;
  int zone = int(t.r * 4.0 + 0.5);
  vec3 c = zone == 0 ? vSkin : zone == 1 ? vHair : zone == 2 ? vShirt : zone == 3 ? vLegs : vLegs * 0.45;
  color = vec4(c * t.g * 1.5 * uSky, 1.0);
}`;

  const MARK_VS = HEAD + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in float aShade;
uniform mat4 uM;
uniform vec3 uCenter;
uniform float uSize;
uniform float uSpin;
out float vShade;
void main() {
  float c = cos(uSpin), s = sin(uSpin);
  vec3 p = vec3(aPos.x * c + aPos.z * s, aPos.y, aPos.z * c - aPos.x * s) * uSize;
  vShade = aShade;
  gl_Position = uM * vec4(uCenter + p, 1.0);
}`;

  const MARK_FS = HEAD + `
in float vShade;
uniform vec3 uColor;
out vec4 color;
void main() { color = vec4(uColor * vShade, 1.0); }`;

  const markMesh = () => {
    const top = [0, 1.45, 0], low = [0, -1.45, 0], ring = [[1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1]], out = [];
    const shades = [1.15, 0.95, 0.7, 0.9];
    ring.forEach((a, i) => {
      const b = ring[(i + 1) % 4];
      for (const p of [top, a, b]) out.push(p[0], p[1], p[2], shades[i]);
      for (const p of [low, b, a]) out.push(p[0], p[1], p[2], shades[i] * 0.72);
    });
    return new Float32Array(out);
  };

  const WALKER_VS = HEAD + LIGHT + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 iPos;
uniform mat4 uM;
uniform vec4 uTurn;
uniform vec3 uSky;
out vec3 vColor;
void main() {
  vec2 t = vec2(uTurn.x * aNormal.x + uTurn.y * aNormal.z, uTurn.z * aNormal.x + uTurn.w * aNormal.z);
  float l = 0.62 + 0.46 * max(dot(vec3(t.x, aNormal.y, t.y), LIGHT), 0.0);
  vColor = mix(vec3(0.95, 0.5, 0.2), vec3(0.2, 0.55, 0.95), iPos.w) * l * uSky;
  gl_Position = uM * vec4(aPos + iPos.xyz, 1.0);
}`;

  const WALKER_FS = HEAD + `
in vec3 vColor;
out vec4 color;
void main() { color = vec4(vColor, 1.0); }`;

  const WATER_VS = HEAD + `
layout(location = 0) in vec2 aPos;
uniform mat4 uM;
uniform vec2 uFocus;
out vec2 vWorld;
void main() {
  vWorld = aPos * ${M.town * 2}.0 + uFocus;
  gl_Position = uM * vec4(vWorld.x, 0.0, vWorld.y, 1.0);
}`;

  const WATER_FS = HEAD + `
in vec2 vWorld;
uniform float uTime;
uniform vec3 uSky;
out vec4 color;
void main() {
  float w = sin(vWorld.x * 0.7 + uTime) * sin(vWorld.y * 0.9 - uTime * 0.7);
  color = vec4(mix(vec3(${SEA.join(', ')}), vec3(0.18, 0.42, 0.62), 0.5 + 0.5 * w) * uSky, 0.8);
}`;

  const POST_VS = HEAD + `
void main() {
  vec2 p = vec2(float((gl_VertexID & 1) * 4) - 1.0, float((gl_VertexID & 2) * 2) - 1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`;

  const POST_FS = HEAD + `
uniform sampler2D uFrame;
uniform vec2 uSize;
uniform float uScale;
uniform float uShutter;
uniform float uDither;
out vec4 color;
const float BAYER[16] = float[16](0.03125, 0.53125, 0.15625, 0.65625, 0.78125, 0.28125, 0.90625, 0.40625, 0.21875, 0.71875, 0.09375, 0.59375, 0.96875, 0.46875, 0.84375, 0.34375);
void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 q = (p - floor(uSize * 0.5)) / uScale + floor(uSize * 0.5);
  vec3 c = texture(uFrame, q / uSize).rgb;
  if (uDither > 0.5) {
    ivec2 i = ivec2(p) & 3;
    vec3 levels = vec3(31.0, 63.0, 31.0);
    c = floor(c * levels + BAYER[i.y * 4 + i.x]) / levels;
  }
  color = vec4(c * (1.0 - 0.6 * uShutter), 1.0);
}`;

  const capsule = () => {
    const rings = [[0, 0.04], [0.2, 0.22], [1.3, 0.25], [1.55, 0.18], [1.75, 0.02]], sides = 8;
    const verts = [], index = [];
    rings.forEach(([y, r], ri) => {
      for (let i = 0; i < sides; i++) {
        const a = i / sides * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
        verts.push(cx * r, y, cz * r, cx, ri === 0 ? -0.6 : ri >= 3 ? 0.7 : 0.15, cz);
      }
    });
    for (let ri = 0; ri < rings.length - 1; ri++) {
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides, a = ri * sides + i, b = ri * sides + j, c = a + sides, d = b + sides;
        index.push(a, b, c, b, d, c);
      }
    }
    return { verts: new Float32Array(verts), index: new Uint16Array(index) };
  };

  class Render {
    constructor(gpu) {
      this.gpu = gpu;
      this.gl = gpu.gl;
      const gl = this.gl;
      this.terrainP = gpu.program(TERRAIN_VS, TERRAIN_FS);
      this.spriteP = gpu.program(SPRITE_VS, SPRITE_FS);
      this.shadowP = gpu.program(SPRITE_VS, SHADOW_FS);
      this.houseP = gpu.program(HOUSE_VS, HOUSE_FS);
      this.houseShadowP = gpu.program(HOUSE_SHADOW_VS, HOUSE_SHADOW_FS);
      this.simP = gpu.program(SIM_VS, SIM_FS);
      this.simShadowP = gpu.program(SIM_VS, SIM_SHADOW_FS);
      this.silhouetteP = gpu.program(SIM_VS, SILHOUETTE_FS);
      this.markP = gpu.program(MARK_VS, MARK_FS);
      this.figureBakeP = gpu.program(SIM_VS, FIGURE_BAKE_FS);
      this.faceP = gpu.program(SIM_VS, FACE_FS);
      this.figureP = gpu.program(FIGURE_VS, FIGURE_FS);
      this.walkerP = gpu.program(WALKER_VS, WALKER_FS);
      this.waterP = gpu.program(WATER_VS, WATER_FS);
      this.postP = gpu.program(POST_VS, POST_FS);
      this.stats = { draws: 0, sprites: 0, tris: 0, chunks: 0 };
      this.visible = [];
      this.grids = new Map();
      this.emptyVao = gl.createVertexArray();
      this.chunkData = new Int16Array((M.town / M.chunk) ** 2 * 2);
      this.chunkBuffer = gpu.buffer(gl.ARRAY_BUFFER, this.chunkData, gl.DYNAMIC_DRAW);
      this.spriteVao = gl.createVertexArray();
      gl.bindVertexArray(this.spriteVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1])));
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      for (const i of [1, 2, 3, 4]) {
        gl.enableVertexAttribArray(i);
        gl.vertexAttribDivisor(i, 1);
      }
      this.waterVao = gl.createVertexArray();
      gl.bindVertexArray(this.waterVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])));
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const mesh = capsule();
      this.walkerCount = mesh.index.length;
      this.walkerVao = gl.createVertexArray();
      gl.bindVertexArray(this.walkerVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer(gl.ARRAY_BUFFER, mesh.verts));
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu.buffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index));
      gl.bindVertexArray(null);
      const St = S.Style, patterns = St.PATTERNS.length, levels = Math.log2(St.SIZE) + 1;
      this.patternTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.patternTex);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, St.SIZE, St.SIZE, patterns);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, St.SIZE, St.SIZE, patterns, gl.RGBA, gl.UNSIGNED_BYTE, St.patternData());
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gpu.bytes += Math.round(St.SIZE * St.SIZE * patterns * 4 * 4 / 3);
      this.setStyles([]);
      this.lightTex = gpu.textureArray(M.town, M.floors);
      const empty = new Uint8Array(M.town * M.town * 4);
      for (let i = 3; i < empty.length; i += 4) empty[i] = OUTDOOR_TEXEL;
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, M.town, M.town, 1, gl.RGBA, gl.UNSIGNED_BYTE, empty);
      for (let k = 1; k < M.floors; k++) gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, k, M.town, M.town, 1, gl.RGBA, gl.UNSIGNED_BYTE, empty);
      const mark = markMesh();
      this.markCount = mark.length / 4;
      this.markVao = gl.createVertexArray();
      gl.bindVertexArray(this.markVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer(gl.ARRAY_BUFFER, mark));
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
      gl.bindVertexArray(null);
      this.simMeshes = new Map();
      this.skinLayers = new Map();
      this.skinFaces = new Map();
      this.figureAtlas = null;
      this.figureData = new ArrayBuffer(FIGURE_STRIDE * 128);
      this.figureBuffer = gpu.buffer(gl.ARRAY_BUFFER, new Uint8Array(this.figureData), gl.DYNAMIC_DRAW);
      this.figureVao = gl.createVertexArray();
      gl.bindVertexArray(this.figureVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1])));
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.figureBuffer);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, FIGURE_STRIDE, 0);
      gl.vertexAttribDivisor(1, 1);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_SHORT, FIGURE_STRIDE, 12);
      gl.vertexAttribDivisor(2, 1);
      for (let i = 0; i < 4; i++) {
        gl.enableVertexAttribArray(3 + i);
        gl.vertexAttribPointer(3 + i, 4, gl.UNSIGNED_BYTE, true, FIGURE_STRIDE, 16 + i * 4);
        gl.vertexAttribDivisor(3 + i, 1);
      }
      gl.bindVertexArray(null);
      this.carData = new ArrayBuffer(INSTANCE_BYTES * 64);
      this.carBuffer = gpu.buffer(gl.ARRAY_BUFFER, new Uint8Array(this.carData), gl.DYNAMIC_DRAW);
      this.carCount = 0;
      this.skinTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.skinTex);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, SKIN_LEVELS, gl.RGBA8, S.Skin.SIZE, S.Skin.SIZE, SKIN_LAYERS);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gpu.bytes += Math.round(S.Skin.SIZE * S.Skin.SIZE * SKIN_LAYERS * 4 * 4 / 3);
      this.sky = [1, 1, 1];
      this.active = null;
      this.activeKey = '';
      this.activeMesh = null;
    }

    setStyles(rows) {
      const gl = this.gl, St = S.Style, w = St.CHANNELS * St.ROW_TEXELS, data = St.table(rows);
      if (!this.styleTex) {
        this.styleTex = this.gpu.texture2D(w, St.ROWS, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, data, gl.NEAREST);
        this.gpu.bytes += data.byteLength;
      } else {
        gl.bindTexture(gl.TEXTURE_2D, this.styleTex);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, St.ROWS, gl.RGBA, gl.UNSIGNED_BYTE, data);
      }
    }

    bindStyles(P, unitA, unitB) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0 + unitA);
      gl.bindTexture(gl.TEXTURE_2D, this.styleTex);
      gl.uniform1i(P.u.uStyle, unitA);
      gl.activeTexture(gl.TEXTURE0 + unitB);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.patternTex);
      gl.uniform1i(P.u.uPattern, unitB);
    }

    bindLight(P, unit) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.lightTex);
      gl.uniform1i(P.u.uLight, unit);
      gl.uniform3f(P.u.uSky, this.sky[0], this.sky[1], this.sky[2]);
    }

    setStyle(index, row) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, index * INSTANCE_BYTES + 15, new Uint8Array([row]));
    }

    setItemKind(index, kind) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, index * INSTANCE_BYTES + 12, new Uint16Array([kind]));
    }

    refreshItem(house, item) {
      const a = this.active && this.active.house === house ? this.active : null;
      this.setItemFlags(item.index, S.House.itemFlags(house, item, a ? { floor: a.floor, mode: a.mode, rot: a.rot } : null));
    }

    setItemFlags(index, flags) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, index * INSTANCE_BYTES + FLAGS_OFFSET, new Uint8Array([flags]));
    }

    grid(step) {
      if (this.grids.has(step)) return this.grids.get(step);
      const gl = this.gl, gpu = this.gpu, side = M.chunk / step + 1, verts = new Int16Array(side * side * 2), index = new Uint16Array((side - 1) * (side - 1) * 6);
      for (let j = 0; j < side; j++) {
        for (let i = 0; i < side; i++) {
          verts[(i + j * side) * 2] = i * step;
          verts[(i + j * side) * 2 + 1] = j * step;
        }
      }
      let q = 0;
      for (let j = 0; j < side - 1; j++) {
        for (let i = 0; i < side - 1; i++) {
          const a = i + j * side, b = a + 1, c = a + side, d = c + 1;
          index[q++] = a;
          index[q++] = b;
          index[q++] = c;
          index[q++] = b;
          index[q++] = d;
          index[q++] = c;
        }
      }
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer(gl.ARRAY_BUFFER, verts));
      gl.enableVertexAttribArray(0);
      gl.vertexAttribIPointer(0, 2, gl.SHORT, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.chunkBuffer);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribIPointer(1, 2, gl.SHORT, 0, 0);
      gl.vertexAttribDivisor(1, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu.buffer(gl.ELEMENT_ARRAY_BUFFER, index));
      gl.bindVertexArray(null);
      const grid = { vao, count: index.length };
      this.grids.set(step, grid);
      return grid;
    }

    resize(w, h) {
      const gl = this.gl;
      if (this.w === w && this.h === h) return;
      if (this.frame) {
        gl.deleteTexture(this.frame);
        gl.deleteRenderbuffer(this.depth);
        gl.deleteFramebuffer(this.fbo);
        this.gpu.bytes -= this.w * this.h * 8;
      }
      this.w = w;
      this.h = h;
      this.frame = this.gpu.texture2D(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null, gl.NEAREST);
      this.depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, w, h);
      this.fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frame, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.depth);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.gpu.bytes += w * h * 8;
    }

    setScene(scene, atlas) {
      const gl = this.gl, gpu = this.gpu, t = scene.terrain;
      this.scene = scene;
      this.atlas = atlas;
      this.houses = scene.houses || [];
      this.heightTex = gpu.texture2D(t.side, t.side, gl.R32F, gl.RED, gl.FLOAT, t.heights, gl.NEAREST);
      gpu.bytes += t.heights.byteLength;
      const paint = S.Terrain.colors(t);
      this.paintTex = gpu.texture2D(t.size, t.size, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, paint, gl.LINEAR);
      gpu.bytes += paint.byteLength;
      const bytes = new ArrayBuffer(scene.count * INSTANCE_BYTES), floats = new Float32Array(bytes), view = new DataView(bytes);
      for (let i = 0; i < scene.count; i++) {
        floats[i * 4] = scene.pos[i * 3];
        floats[i * 4 + 1] = scene.pos[i * 3 + 1];
        floats[i * 4 + 2] = scene.pos[i * 3 + 2];
        view.setUint16(i * INSTANCE_BYTES + 12, scene.kind[i], true);
        view.setUint8(i * INSTANCE_BYTES + FLAGS_OFFSET, scene.facing[i]);
      }
      this.instanceBuffer = gpu.buffer(gl.ARRAY_BUFFER, new Uint8Array(bytes));
      this.walkerData = new Float32Array(scene.walkers.length * 4);
      this.walkerBuffer = gpu.buffer(gl.ARRAY_BUFFER, this.walkerData, gl.DYNAMIC_DRAW);
      gl.bindVertexArray(this.walkerVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.walkerBuffer);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(2, 1);
      gl.bindVertexArray(null);
      this.active = null;
      this.activeKey = '';
      this.activeMesh = null;
      for (const h of this.houses) {
        this.rebuildHouse(h);
        this.uploadLight(h);
      }
    }

    uploadMesh(target, mesh) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, target.vertices);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, target.indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.index, gl.DYNAMIC_DRAW);
      const size = mesh.data.byteLength + mesh.index.byteLength;
      this.gpu.bytes += size - target.bytes;
      target.bytes = size;
      target.count = mesh.count;
      target.solidStart = mesh.solidStart;
      target.top = mesh.top;
    }

    newMesh() {
      const gl = this.gl, target = { vao: gl.createVertexArray(), vertices: gl.createBuffer(), indices: gl.createBuffer(), bytes: 0, count: 0, solidStart: 0, top: 0 }, stride = S.HouseMesh.STRIDE;
      gl.bindVertexArray(target.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, target.vertices);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, target.indices);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 3, gl.BYTE, true, stride, 20);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 1, gl.UNSIGNED_BYTE, true, stride, 23);
      gl.enableVertexAttribArray(4);
      gl.vertexAttribIPointer(4, 3, gl.UNSIGNED_BYTE, stride, 24);
      gl.bindVertexArray(null);
      return target;
    }

    rebuildHouse(h) {
      if (!h.gpu || h.gpuOwner !== this) {
        h.gpu = this.newMesh();
        h.gpuOwner = this;
      }
      this.uploadMesh(h.gpu, S.HouseMesh.build(h, null));
      this.activeKey = '';
    }

    uploadLight(h) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.lightTex);
      for (let k = 0; k < h.floors.length; k++) {
        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, h.x, h.z, k, h.w, h.d, 1, gl.RGBA, gl.UNSIGNED_BYTE, S.House.lightBytes(h, k));
      }
    }

    setActive(active) {
      const key = active ? [active.house.id, active.floor, active.mode, active.mode === 'cut' ? active.rot : 0].join() : '';
      if (key === this.activeKey) return;
      const before = this.active;
      this.active = active;
      this.activeKey = key;
      if (before && (!active || before.house !== active.house)) {
        for (const item of before.house.items) this.setItemFlags(item.index, S.House.itemFlags(before.house, item, null));
      }
      if (!active) return;
      const view = { floor: active.floor, mode: active.mode, rot: active.rot }, h = active.house;
      for (const item of h.items) this.setItemFlags(item.index, S.House.itemFlags(h, item, view));
      if (S.House.showsRoof(h, view)) {
        this.activeUsed = false;
        return;
      }
      if (!this.activeMesh) this.activeMesh = this.newMesh();
      this.uploadMesh(this.activeMesh, S.HouseMesh.build(h, view));
      this.activeUsed = true;
    }

    skinOf(sim) {
      const face = sim.face || 0, known = this.skinLayers.get(sim.id);
      if (known !== undefined && this.skinFaces.get(sim.id) === face) return known;
      if (this.skinPainted) return known === undefined ? 0 : known;
      this.skinPainted = true;
      const gl = this.gl, canvas = this.skinCanvas || (this.skinCanvas = document.createElement('canvas')), size = S.Skin.SIZE;
      canvas.width = size;
      canvas.height = size;
      S.Skin.paint(canvas.getContext('2d'), sim.look, face);
      let layer = known === undefined ? this.skinLayers.size : known;
      if (known === undefined && layer >= SKIN_LAYERS) {
        const keep = new Set(this.shownSims.map(([s]) => s.id));
        for (const [id, used] of this.skinLayers) {
          if (!keep.has(id)) {
            layer = used;
            this.skinLayers.delete(id);
            this.skinFaces.delete(id);
            break;
          }
        }
        if (layer >= SKIN_LAYERS) return 0;
      }
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.skinTex);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, size, size, 1, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      const small = this.skinSmall || (this.skinSmall = document.createElement('canvas'));
      for (let level = 1, s = size >> 1; level < SKIN_LEVELS; level++, s >>= 1) {
        small.width = s;
        small.height = s;
        small.getContext('2d').drawImage(canvas, 0, 0, s, s);
        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, level, 0, 0, layer, s, s, 1, gl.RGBA, gl.UNSIGNED_BYTE, small);
      }
      this.skinLayers.set(sim.id, layer);
      this.skinFaces.set(sim.id, face);
      return layer;
    }

    simMesh(key, mesh) {
      if (this.simMeshes.has(key)) return this.simMeshes.get(key);
      const gl = this.gl, gpu = this.gpu, stride = S.Body.STRIDE, vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer(gl.ARRAY_BUFFER, new Uint8Array(mesh.data)));
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.BYTE, true, stride, 12);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.UNSIGNED_SHORT, true, stride, 16);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribIPointer(3, 2, gl.UNSIGNED_BYTE, stride, 20);
      gl.enableVertexAttribArray(4);
      gl.vertexAttribPointer(4, 1, gl.UNSIGNED_BYTE, true, stride, 22);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu.buffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index));
      gl.bindVertexArray(null);
      const made = { vao, count: mesh.count };
      this.simMeshes.set(key, made);
      return made;
    }

    portrait(sim, w, h) {
      const gl = this.gl, gpu = this.gpu, P = this.faceP, pw = w * FACE_SUPER, ph = h * FACE_SUPER;
      if (!this.faceTarget) {
        const color = gpu.texture2D(FACE_TARGET, FACE_TARGET, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null, gl.NEAREST), depth = gl.createRenderbuffer(), fbo = gl.createFramebuffer();
        gpu.bytes += FACE_TARGET * FACE_TARGET * 4;
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, FACE_TARGET, FACE_TARGET);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
        this.faceTarget = fbo;
      }
      const B = S.Body.B, skel = sim.skel, rot = new Float32Array(S.Body.COUNT * 3), root = [0, 0, 0], rows = new Float32Array(S.Body.COUNT * 12), top = S.Body.height(sim.age);
      S.Clips.sample('idle', 0, rot, root);
      S.Body.pose(skel, rot, root, 0, 0, 0, FACE_YAW, rows);
      const head = top - skel.bind[B.head * 3 + 1], hh = head * FACE_ZOOM, hw = hh * w / h, cy = top + head * 0.12 - hh;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.faceTarget);
      gl.viewport(0, 0, pw, ph);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.disable(gl.BLEND);
      gl.disable(gl.STENCIL_TEST);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uM, false, new Float32Array([1 / hw, 0, 0, 0, 0, 1 / hh, 0, 0, 0, 0, -0.3, 0, 0, -cy / hh, 0, 1]));
      gl.uniform4f(P.u.uTurn, 1, 0, 0, 1);
      gl.uniform1f(P.u.uPlane, NO_PLANE);
      gl.uniform1f(P.u.uBias, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.skinTex);
      gl.uniform1i(P.u.uSkin, 1);
      this.skinPainted = false;
      gl.uniform1f(P.u.uSkinLayer, this.skinOf(sim));
      this.drawSimMeshes({ age: sim.age, sex: sim.sex, hair: sim.hair, rows }, 0, P);
      gl.bindVertexArray(null);
      const raw = new Uint8Array(pw * ph * 4), canvas = document.createElement('canvas');
      gl.readPixels(0, 0, pw, ph, gl.RGBA, gl.UNSIGNED_BYTE, raw);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      canvas.width = w;
      canvas.height = h;
      const g = canvas.getContext('2d'), image = g.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let r = 0, gr = 0, b = 0, hit = 0;
          for (let j = 0; j < FACE_SUPER; j++) {
            for (let i = 0; i < FACE_SUPER; i++) {
              const o = ((x * FACE_SUPER + i) + ((h - 1 - y) * FACE_SUPER + j) * pw) * 4;
              if (raw[o + 3] < 128) continue;
              r += raw[o];
              gr += raw[o + 1];
              b += raw[o + 2];
              hit++;
            }
          }
          if (hit * 2 < FACE_SUPER * FACE_SUPER) continue;
          const c = S.Kit.dithered([r / hit, gr / hit, b / hit], x, y), o = (x + y * w) * 4;
          image.data[o] = c[0];
          image.data[o + 1] = c[1];
          image.data[o + 2] = c[2];
          image.data[o + 3] = 255;
        }
      }
      g.putImageData(image, 0, 0);
      return canvas;
    }

    bakeFigures() {
      if (this.figureAtlas) return;
      const gl = this.gl, gpu = this.gpu, width = FIGURE_COLUMNS * FIGURE_CELLS[0], height = FIGURE_SHAPES.length * (FIGURE_CELLS[0] + FIGURE_CELLS[1]);
      const color = gpu.texture2D(width, height, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null, gl.NEAREST), depth = gl.createRenderbuffer(), fbo = gl.createFramebuffer();
      gpu.bytes += width * height * 4;
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.SCISSOR_TEST);
      const P = this.figureBakeP, rot = new Float32Array(S.Body.COUNT * 3), root = [0, 0, 0], rows = new Float32Array(S.Body.COUNT * 12);
      gl.useProgram(P.p);
      gl.uniform1f(P.u.uPlane, NO_PLANE);
      gl.uniform1f(P.u.uBias, 0);
      gl.uniform4f(P.u.uTurn, 1, 0, 0, 1);
      FIGURE_CELLS.forEach((cell, size) => {
        const cam = new S.Camera(cell, cell), zoom = 3 + size, [ax, ay] = FIGURE_ANCHORS[size], offsetY = size === 0 ? 0 : FIGURE_SHAPES.length * FIGURE_CELLS[0];
        cam.setView({ zoom, rot: 0, x: M.town / 2, z: M.town / 2 });
        gl.uniformMatrix4fv(P.u.uM, false, cam.m);
        FIGURE_SHAPES.forEach((age, shape) => {
          const skel = S.Body.skeleton(age, 'm'), body = this.simMesh('b' + age + 'm1', S.Body.mesh(age, 'm', 1)), hairMesh = S.Body.hair('short', age, 1), hair = this.simMesh('hshort' + age + '1', hairMesh);
          const y0 = (cell / 2 - ay) / cam.unitY;
          for (let dir = 0; dir < FIGURE_DIRS; dir++) {
            for (let frame = 0; frame < FIGURE_FRAMES; frame++) {
              const x = (dir * FIGURE_FRAMES + frame) * cell, y = offsetY + shape * cell;
              gl.viewport(x + ax - Math.floor(cell / 2), y, cell, cell);
              gl.scissor(x, y, cell, cell);
              S.Clips.sample(frame === 0 ? 'idle' : 'walk', FIGURE_PHASES[frame], rot, root);
              S.Body.pose(skel, rot, root, M.town / 2, y0, M.town / 2, dir * Math.PI / 4, rows);
              gl.uniform4fv(P.u['uBones[0]'], rows);
              gl.uniform1f(P.u.uHairZone, 0);
              gl.bindVertexArray(body.vao);
              gl.drawElements(gl.TRIANGLES, body.count, gl.UNSIGNED_SHORT, 0);
              gl.uniform1f(P.u.uHairZone, 1);
              gl.bindVertexArray(hair.vao);
              gl.drawElements(gl.TRIANGLES, hair.count, gl.UNSIGNED_SHORT, 0);
            }
          }
        });
      });
      gl.disable(gl.SCISSOR_TEST);
      gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(fbo);
      gl.deleteRenderbuffer(depth);
      this.figureAtlas = color;
    }

    drawFigures(cam, view) {
      const gl = this.gl, world = view.world, P = this.figureP, size = cam.zoom === 3 ? 0 : 1, cell = FIGURE_CELLS[size], [ax, ay] = FIGURE_ANCHORS[size];
      const data = this.figureData, view32 = new DataView(data);
      let count = 0;
      const push = (sim, frame) => {
        const o = count * FIGURE_STRIDE;
        if (o + FIGURE_STRIDE > data.byteLength) return;
        view32.setFloat32(o, sim.x, true);
        view32.setFloat32(o + 4, sim.y, true);
        view32.setFloat32(o + 8, sim.z, true);
        view32.setUint16(o + 12, frame, true);
        const colors = sim.figureColors || (sim.figureColors = [sim.look.skin, sim.look.hair, sim.look.shirt, sim.look.trousers].map(t => [parseInt(t.slice(1, 3), 16), parseInt(t.slice(3, 5), 16), parseInt(t.slice(5, 7), 16)]));
        colors.forEach((c, i) => {
          view32.setUint8(o + 16 + i * 4, c[0]);
          view32.setUint8(o + 17 + i * 4, c[1]);
          view32.setUint8(o + 18 + i * 4, c[2]);
          view32.setUint8(o + 19 + i * 4, 255);
        });
        count++;
      };
      for (const sim of world.sims) {
        if (sim.inside || sim.state === 'drive' || !cam.seesBox(sim.x - 1, sim.z - 1, sim.x + 1, sim.z + 1, sim.y, sim.y + 2)) continue;
        const fx = Math.sin(sim.yaw), fz = Math.cos(sim.yaw), vx = cam.a * fx + cam.b * fz, vz = cam.c * fx + cam.d * fz;
        const dir = ((Math.round(Math.atan2(vx, vz) / (Math.PI / 4)) % FIGURE_DIRS) + FIGURE_DIRS) % FIGURE_DIRS;
        const moving = S.Sim.moving(sim), frame = moving ? 1 + Math.floor(((sim.phase % 1) + 1) % 1 * 4) : 0;
        const shape = sim.age === 'child' ? 1 : sim.age === 'toddler' ? 2 : 0;
        push(sim, shape * FIGURE_COLUMNS + dir * FIGURE_FRAMES + frame);
      }
      this.stats.sims = count;
      if (!count) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.figureBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Uint8Array(data, 0, count * FIGURE_STRIDE));
      gl.useProgram(P.p);
      gl.uniform4f(P.u.uTurn, cam.a, cam.b, cam.c, cam.d);
      gl.uniform4f(P.u.uCam, cam.tile, cam.unitY, cam.camX, cam.camY);
      gl.uniform2f(P.u.uHalf, cam.halfW, cam.halfH);
      gl.uniform2f(P.u.uSize, cam.w, cam.h);
      gl.uniform3f(P.u.uDepth, S.DEPTH.K, S.DEPTH.N, cam.depth0);
      gl.uniform1f(P.u.uRange, S.DEPTH.R);
      gl.uniform4f(P.u.uCell, cell, size === 0 ? 0 : FIGURE_SHAPES.length * FIGURE_CELLS[0], ax, ay);
      gl.uniform1f(P.u.uScreenH, cam.h);
      gl.uniform3f(P.u.uSky, this.sky[0], this.sky[1], this.sky[2]);
      gl.uniform1i(P.u.uCellSize, cell);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.figureAtlas);
      gl.uniform1i(P.u.uAtlas, 0);
      gl.bindVertexArray(this.figureVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      gl.bindVertexArray(null);
      this.stats.draws++;
      this.stats.tris += count * 2;
    }

    prepareCars(view) {
      const world = view.world;
      this.carCount = 0;
      if (!world || !world.cars.length) return;
      const v = new DataView(this.carData), gl = this.gl;
      for (const sim of world.cars) {
        if (this.carCount >= 64) break;
        const o = this.carCount * INSTANCE_BYTES, sprite = S.Sim.carSprite(sim.car.dx, sim.car.dz, sim.ride);
        v.setFloat32(o, sim.car.x, true);
        v.setFloat32(o + 4, sim.car.y, true);
        v.setFloat32(o + 8, sim.car.z, true);
        v.setUint16(o + 12, S.KIND_ID[sprite.kind], true);
        v.setUint8(o + FLAGS_OFFSET, sprite.facing);
        v.setUint8(o + 15, world.carRows[sim.ride ? S.RIDES[sim.ride] : sim.carColor]);
        this.carCount++;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.carBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Uint8Array(this.carData, 0, this.carCount * INSTANCE_BYTES));
    }

    drawCars() {
      if (!this.carCount) return;
      const gl = this.gl;
      gl.bindVertexArray(this.spriteVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.carBuffer);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, INSTANCE_BYTES, 0);
      gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_SHORT, INSTANCE_BYTES, 12);
      gl.vertexAttribIPointer(3, 1, gl.UNSIGNED_BYTE, INSTANCE_BYTES, FLAGS_OFFSET);
      gl.vertexAttribIPointer(4, 1, gl.UNSIGNED_BYTE, INSTANCE_BYTES, 15);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.carCount);
      this.stats.draws++;
      this.stats.tris += this.carCount * 2;
    }

    drawSimMeshes(sim, lod, P) {
      const gl = this.gl, body = this.simMesh('b' + sim.age + sim.sex + lod, S.Body.mesh(sim.age, sim.sex, lod));
      gl.uniform4fv(P.u['uBones[0]'], sim.rows);
      gl.bindVertexArray(body.vao);
      gl.drawElements(gl.TRIANGLES, body.count, gl.UNSIGNED_SHORT, 0);
      this.stats.draws++;
      this.stats.tris += body.count / 3;
      const hairMesh = S.Body.hair(sim.hair, sim.age, lod);
      if (!hairMesh) return;
      const hair = this.simMesh('h' + sim.hair + sim.age + lod, hairMesh);
      gl.bindVertexArray(hair.vao);
      gl.drawElements(gl.TRIANGLES, hair.count, gl.UNSIGNED_SHORT, 0);
      this.stats.draws++;
      this.stats.tris += hair.count / 3;
    }

    simFloorState(sim) {
      const a = this.active;
      if (!a || !sim.lot || a.house !== sim.lot.house || S.House.showsRoof(a.house, a)) return 1;
      if (sim.floor > a.floor) return 0;
      return sim.floor < a.floor ? DIM_VALUE : 1;
    }

    readySims(cam, view) {
      const world = view.world, shown = [];
      this.shownSims = shown;
      if (cam.zoom > FIGURES_FROM - 1) return;
      for (const sim of world.live) {
        if (sim.inside || sim.state === 'drive') continue;
        const state = this.simFloorState(sim);
        if (!state || !cam.seesBox(sim.x - 1, sim.z - 1, sim.x + 1, sim.z + 1, sim.y, sim.y + 2)) continue;
        S.Sim.pose(sim);
        shown.push([sim, state]);
      }
    }

    drawGhost(cam, view) {
      const gl = this.gl, chosen = this.shownSims.find(([sim]) => sim === view.selected), P = this.silhouetteP;
      if (!chosen) return;
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uM, false, cam.m);
      gl.uniform4f(P.u.uTurn, cam.a, cam.b, cam.c, cam.d);
      gl.uniform1f(P.u.uPlane, NO_PLANE);
      gl.uniform1f(P.u.uBias, GHOST_MARGIN / S.DEPTH.R);
      const low = this.active && this.active.mode !== 'up';
      gl.uniform1f(P.u.uFloorY, low ? chosen[0].y + GHOST_ABOVE_LOW_WALL : NO_PLANE);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.depthFunc(gl.GREATER);
      gl.enable(gl.STENCIL_TEST);
      gl.stencilMask(SIM_GHOST_BIT);
      gl.stencilFunc(gl.NOTEQUAL, SIM_GHOST_BIT, SIM_GHOST_BIT);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      this.drawSimMeshes(chosen[0], cam.zoom <= 1 ? 0 : 1, P);
      gl.stencilMask(255);
      gl.disable(gl.STENCIL_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }

    drawSims(cam, view) {
      const gl = this.gl, lod = cam.zoom <= 1 ? 0 : 1, shown = this.shownSims;
      if (cam.zoom >= FIGURES_FROM) {
        this.drawFigures(cam, view);
        this.drawMark(cam, view);
        return;
      }
      if (!shown.length) return;
      const Sh = this.simShadowP, power = SIM_SHADOW_POWER * Math.max(0.3, view.sun === undefined ? 1 : view.sun);
      gl.useProgram(Sh.p);
      gl.uniformMatrix4fv(Sh.u.uM, false, cam.m);
      gl.uniform4f(Sh.u.uTurn, cam.a, cam.b, cam.c, cam.d);
      gl.uniform1f(Sh.u.uBias, SHADOW_BIAS / S.DEPTH.R);
      gl.uniform1f(Sh.u.uPower, power);
      this.bindLight(Sh, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.enable(gl.STENCIL_TEST);
      gl.stencilMask(SIM_SHADOW_BIT);
      gl.stencilFunc(gl.NOTEQUAL, SIM_SHADOW_BIT, SIM_SHADOW_BIT);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      for (const [sim] of shown) {
        gl.uniform1f(Sh.u.uBias, (S.Sim.indoors(sim) ? INDOOR_BIAS : SHADOW_BIAS) / S.DEPTH.R);
        gl.uniform1f(Sh.u.uPlane, sim.y);
        gl.uniform1i(Sh.u.uLayer, sim.floor);
        gl.uniform2f(Sh.u.uFeet, sim.x, sim.z);
        this.drawSimMeshes(sim, lod, Sh);
      }
      gl.stencilMask(255);
      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      const P = this.simP;
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uM, false, cam.m);
      gl.uniform4f(P.u.uTurn, cam.a, cam.b, cam.c, cam.d);
      gl.uniform1f(P.u.uPlane, NO_PLANE);
      gl.uniform1f(P.u.uBias, 0);
      this.bindLight(P, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.skinTex);
      gl.uniform1i(P.u.uSkin, 1);
      this.skinPainted = false;
      for (const [sim, state] of shown) {
        gl.uniform1f(P.u.uSkinLayer, this.skinOf(sim));
        gl.uniform1i(P.u.uLayer, sim.floor);
        gl.uniform1f(P.u.uDim, state);
        this.drawSimMeshes(sim, lod, P);
      }
      this.drawMark(cam, view);
    }

    drawMark(cam, view) {
      const gl = this.gl, sim = view.selected, P = this.markP;
      if (!sim || sim.inside || !cam.seesBox(sim.x - 2, sim.z - 2, sim.x + 2, sim.z + 2, sim.y, sim.y + 3)) return;
      const top = sim.y + (sim.state === 'drive' ? 1.6 : S.Body.height(sim.age)) + MARK_ABOVE - sim.seatW * 0.7 * sim.scale;
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uM, false, cam.m);
      gl.uniform3f(P.u.uCenter, sim.x, top, sim.z);
      gl.uniform1f(P.u.uSize, MARK_SIZE * (1 + cam.zoom * 0.7) ** 2 / (1 + cam.zoom * 0.3));
      gl.uniform1f(P.u.uSpin, view.time * MARK_SPIN);
      gl.uniform3f(P.u.uColor, 0.36, 0.86, 0.34);
      gl.bindVertexArray(this.markVao);
      gl.drawArrays(gl.TRIANGLES, 0, this.markCount);
      gl.bindVertexArray(null);
      gl.enable(gl.DEPTH_TEST);
      this.stats.draws++;
    }

    drawTerrain(cam, visible) {
      const gl = this.gl, P = this.terrainP, step = S.ZOOMS[cam.zoom].step, grid = this.grid(step);
      for (let i = 0; i < visible.length; i++) {
        const id = visible[i], n = M.town / M.chunk;
        this.chunkData[i * 2] = (id % n) * M.chunk;
        this.chunkData[i * 2 + 1] = Math.floor(id / n) * M.chunk;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.chunkBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.chunkData, 0, visible.length * 2);
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uM, false, cam.m);
      gl.uniform4f(P.u.uTurn, cam.a, cam.b, cam.c, cam.d);
      gl.uniform1i(P.u.uStep, step);
      gl.uniform1f(P.u.uGrain, Math.max(1, cam.tile / 16));
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.heightTex);
      gl.uniform1i(P.u.uHeight, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.paintTex);
      gl.uniform1i(P.u.uPaint, 1);
      this.bindLight(P, 2);
      gl.bindVertexArray(grid.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, grid.count, gl.UNSIGNED_SHORT, 0, visible.length);
      this.stats.draws++;
      this.stats.tris += grid.count / 3 * visible.length;
    }

    houseSeen(cam, h) {
      return h.gpu && cam.seesBox(h.x - 1, h.z - 1, h.x + h.w + 1, h.z + h.d + 1, h.base, h.gpu.top + 1);
    }

    drawHouseShadows(cam, power) {
      const gl = this.gl, P = this.houseShadowP;
      if (!this.houses.length || power <= 0) return;
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uM, false, cam.m);
      gl.uniform4f(P.u.uTurn, cam.a, cam.b, cam.c, cam.d);
      gl.uniform1f(P.u.uBias, SHADOW_BIAS / S.DEPTH.R);
      gl.uniform1f(P.u.uPower, 1 - Math.pow(1 - power, 1 / SOFT_EDGE.length));
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.enable(gl.STENCIL_TEST);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      SOFT_EDGE.forEach(([ox, oz], pass) => {
        const bit = 1 << pass;
        gl.stencilMask(bit);
        gl.stencilFunc(gl.NOTEQUAL, bit, bit);
        gl.uniform2f(P.u.uOffset, ox, oz);
        for (const h of this.houses) {
          if (!this.houseSeen(cam, h)) continue;
          gl.uniform1f(P.u.uBase, h.base);
          gl.bindVertexArray(h.gpu.vao);
          gl.drawElements(gl.TRIANGLES, h.gpu.count - h.gpu.solidStart, gl.UNSIGNED_INT, h.gpu.solidStart * 4);
          this.stats.draws++;
        }
      });
      gl.stencilMask(255);
      gl.disable(gl.STENCIL_TEST);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    drawHouses(cam) {
      const gl = this.gl, P = this.houseP;
      if (!this.houses.length) return;
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uM, false, cam.m);
      gl.uniform4f(P.u.uTurn, cam.a, cam.b, cam.c, cam.d);
      this.bindStyles(P, 0, 1);
      this.bindLight(P, 2);
      for (const h of this.houses) {
        if (!this.houseSeen(cam, h)) continue;
        const mesh = this.active && this.active.house === h && this.activeUsed ? this.activeMesh : h.gpu;
        gl.bindVertexArray(mesh.vao);
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_INT, 0);
        this.stats.draws++;
        this.stats.tris += mesh.count / 3;
      }
      gl.bindVertexArray(null);
    }

    spriteUniforms(P, cam, rowBase) {
      const gl = this.gl, D = S.DEPTH;
      gl.useProgram(P.p);
      gl.uniform4f(P.u.uTurn, cam.a, cam.b, cam.c, cam.d);
      gl.uniform4f(P.u.uCam, cam.tile, cam.unitY, cam.camX, cam.camY);
      gl.uniform2f(P.u.uHalf, cam.halfW, cam.halfH);
      gl.uniform2f(P.u.uSize, cam.w, cam.h);
      gl.uniform3f(P.u.uDepth, D.K, D.N, cam.depth0);
      gl.uniform1i(P.u.uZoom, cam.zoom);
      gl.uniform1i(P.u.uRot, cam.rot);
      gl.uniform1i(P.u.uRowBase, rowBase);
      gl.uniform1f(P.u.uScreenH, cam.h);
      gl.uniform1f(P.u.uRange, D.R);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.atlas.tableTexture);
      gl.uniform1i(P.u.uTable, 0);
    }

    drawRuns(visible, count) {
      const gl = this.gl, starts = this.scene.chunkStart;
      gl.bindVertexArray(this.spriteVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      let i = 0;
      while (i < visible.length) {
        let last = i;
        while (last + 1 < visible.length && visible[last + 1] === visible[last] + 1) last++;
        const from = starts[visible[i]], n = starts[visible[last] + 1] - from;
        if (n > 0) {
          const offset = from * INSTANCE_BYTES;
          gl.vertexAttribPointer(1, 3, gl.FLOAT, false, INSTANCE_BYTES, offset);
          gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_SHORT, INSTANCE_BYTES, offset + 12);
          gl.vertexAttribIPointer(3, 1, gl.UNSIGNED_BYTE, INSTANCE_BYTES, offset + FLAGS_OFFSET);
          gl.vertexAttribIPointer(4, 1, gl.UNSIGNED_BYTE, INSTANCE_BYTES, offset + 15);
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
          this.stats.draws++;
          this.stats.tris += n * 2;
          if (count) this.stats.sprites += n;
        }
        i = last + 1;
      }
    }

    drawShadows(cam, visible, power) {
      const gl = this.gl, P = this.shadowP;
      if (power <= 0) return;
      this.spriteUniforms(P, cam, S.SHADOW_ROW);
      gl.uniform1f(P.u.uPower, power);
      gl.uniform1f(P.u.uTile, cam.tile);
      this.bindLight(P, 2);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.atlas.shadow);
      gl.uniform1i(P.u.uShadow, 1);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      this.drawRuns(visible, false);
      this.drawCars();
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    drawSprites(cam, visible) {
      const gl = this.gl, P = this.spriteP, D = S.DEPTH, t4k = cam.tile / (4 * D.K);
      this.spriteUniforms(P, cam, 0);
      gl.uniform2f(P.u.uScale, cam.tile, cam.unitY);
      gl.uniform2f(P.u.uRecon, t4k, D.N * t4k + cam.unitY);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.atlas.color);
      gl.uniform1i(P.u.uColor, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.atlas.data);
      gl.uniform1i(P.u.uData, 2);
      this.bindStyles(P, 3, 4);
      this.bindLight(P, 5);
      this.drawRuns(visible, true);
      this.drawCars();
    }

    drawWalkers(cam) {
      const gl = this.gl, P = this.walkerP, list = this.scene.walkers, data = this.walkerData;
      if (!list.length) return;
      for (let i = 0; i < list.length; i++) {
        data[i * 4] = list[i].x;
        data[i * 4 + 1] = list[i].y;
        data[i * 4 + 2] = list[i].z;
        data[i * 4 + 3] = list[i].tone;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.walkerBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uM, false, cam.m);
      gl.uniform4f(P.u.uTurn, cam.a, cam.b, cam.c, cam.d);
      gl.uniform3f(P.u.uSky, this.sky[0], this.sky[1], this.sky[2]);
      gl.bindVertexArray(this.walkerVao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.walkerCount, gl.UNSIGNED_SHORT, 0, list.length);
      this.stats.draws++;
      this.stats.tris += this.walkerCount / 3 * list.length;
    }

    drawWater(cam, time) {
      const gl = this.gl, P = this.waterP;
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uM, false, cam.m);
      gl.uniform2f(P.u.uFocus, cam.fx, cam.fz);
      gl.uniform1f(P.u.uTime, time);
      gl.uniform3f(P.u.uSky, this.sky[0], this.sky[1], this.sky[2]);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.bindVertexArray(this.waterVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      this.stats.draws++;
      this.stats.tris += 2;
    }

    draw(cam, view) {
      const gl = this.gl, st = this.stats, sky = view.sky || [1, 1, 1], sun = view.sun === undefined ? 1 : view.sun;
      this.sky = sky;
      this.atlas.flush();
      st.draws = 0;
      st.sprites = 0;
      st.tris = 0;
      const visible = cam.visible(this.scene.terrain, this.visible);
      st.chunks = visible.length;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, this.w, this.h);
      gl.clearColor(SEA[0] * sky[0], SEA[1] * sky[1], SEA[2] * sky[2], 1);
      gl.clearDepth(1);
      gl.clearStencil(0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
      if (visible.length) {
        this.drawTerrain(cam, visible);
        this.drawHouseShadows(cam, HOUSE_SHADOW_POWER * sun);
        this.drawHouses(cam);
        if (view.world) {
          this.prepareCars(view);
          this.readySims(cam, view);
          this.drawGhost(cam, view);
        }
        if (this.scene.hasShadows) this.drawShadows(cam, visible, SHADOW_POWER * Math.max(0.25, sun));
        this.drawSprites(cam, visible);
      }
      if (view.world && visible.length) this.drawSims(cam, view);
      this.drawWalkers(cam);
      this.drawWater(cam, view.time);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.w, this.h);
      gl.disable(gl.DEPTH_TEST);
      const P = this.postP;
      gl.useProgram(P.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.frame);
      gl.uniform1i(P.u.uFrame, 0);
      gl.uniform2f(P.u.uSize, this.w, this.h);
      gl.uniform1f(P.u.uScale, view.scale);
      gl.uniform1f(P.u.uShutter, view.shutter);
      gl.uniform1f(P.u.uDither, view.dither ? 1 : 0);
      gl.bindVertexArray(this.emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      st.draws++;
    }
  }

  S.Render = Render;
})(globalThis.Sims98 = globalThis.Sims98 || {});
