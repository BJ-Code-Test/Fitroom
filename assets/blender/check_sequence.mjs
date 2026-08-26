// Gate G9: verify the turntable sequence (120 WebP + 120 PNG, 900x1260, alpha).
import fs from "node:fs";
import path from "node:path";

const WEBP = "D:/FitRoom/public/sequence/mannequin";
const PNG = "D:/FitRoom/assets/blender/turntable_png";
const N = 120, W = 900, H = 1260;
const fail = [];

function webpInfo(file) {
  const b = fs.readFileSync(file);
  if (b.toString("latin1", 0, 4) !== "RIFF" || b.toString("latin1", 8, 12) !== "WEBP")
    return { err: "not a webp" };
  const tag = b.toString("latin1", 12, 16);
  if (tag !== "VP8X") return { err: `chunk ${tag} (no extended header)` };
  const flags = b[20];
  const w = (b[24] | (b[25] << 8) | (b[26] << 16)) + 1;
  const h = (b[27] | (b[28] << 8) | (b[29] << 16)) + 1;
  return { w, h, alpha: !!(flags & 0x10), size: b.length };
}

function pngInfo(file) {
  const b = fs.readFileSync(file);
  if (b.toString("latin1", 1, 4) !== "PNG") return { err: "not a png" };
  return {
    w: b.readUInt32BE(16), h: b.readUInt32BE(20),
    bitDepth: b[24], colorType: b[25], size: b.length,
  };
}

let total = 0, maxFrame = 0;
for (let i = 1; i <= N; i++) {
  const id = String(i).padStart(4, "0");
  const wf = path.join(WEBP, `${id}.webp`);
  const pf = path.join(PNG, `${id}.png`);
  if (!fs.existsSync(wf)) { fail.push(`missing ${wf}`); continue; }
  if (!fs.existsSync(pf)) { fail.push(`missing ${pf}`); continue; }
  const wi = webpInfo(wf), pi = pngInfo(pf);
  if (wi.err) fail.push(`${id}.webp: ${wi.err}`);
  else {
    if (wi.w !== W || wi.h !== H) fail.push(`${id}.webp ${wi.w}x${wi.h}`);
    if (!wi.alpha) fail.push(`${id}.webp has no alpha`);
    if (wi.size > 90 * 1024) fail.push(`${id}.webp ${wi.size} B > 90 KB`);
    total += wi.size;
    maxFrame = Math.max(maxFrame, wi.size);
  }
  if (pi.err) fail.push(`${id}.png: ${pi.err}`);
  else {
    if (pi.w !== W || pi.h !== H) fail.push(`${id}.png ${pi.w}x${pi.h}`);
    if (pi.colorType !== 6) fail.push(`${id}.png colorType ${pi.colorType} (want 6 = RGBA)`);
  }
}
const extraW = fs.readdirSync(WEBP).filter(f => f.endsWith(".webp")).length - N;
const extraP = fs.readdirSync(PNG).filter(f => f.endsWith(".png")).length - N;
if (extraW) fail.push(`${extraW} extra webp files`);
if (extraP) fail.push(`${extraP} extra png files`);
if (total > 10 * 1024 * 1024) fail.push(`total ${total} B > 10 MB`);

console.log(`frames=${N} total=${total} B (${(total / 1048576).toFixed(2)} MB) ` +
  `avg=${Math.round(total / N)} B (${(total / N / 1024).toFixed(1)} KB) ` +
  `max=${maxFrame} B res=${W}x${H} alpha=yes`);
console.log(fail.length ? "SEQ_FAILED\n" + fail.slice(0, 20).join("\n") : "SEQ_OK");
process.exit(fail.length ? 1 : 0);
