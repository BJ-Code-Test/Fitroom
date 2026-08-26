// G9 - app files must be unchanged since the start of this session.
// First run (no baseline) writes the baseline and reports BASELINE_WRITTEN.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = 'D:/FitRoom';
const BASE = path.join(ROOT, 'assets/blender/.untouched_baseline.json');
const ROOTS = ['src', 'tests', 'index.html', 'package.json'];

function walk(rel, out) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return;
  const st = fs.statSync(abs);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(abs).sort()) walk(path.posix.join(rel, e), out);
  } else {
    out[rel] = crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex');
  }
}

const now = {};
for (const r of ROOTS) walk(r, now);

if (!fs.existsSync(BASE)) {
  fs.writeFileSync(BASE, JSON.stringify(now, null, 1));
  console.log('BASELINE_WRITTEN files=' + Object.keys(now).length);
  process.exit(0);
}

const before = JSON.parse(fs.readFileSync(BASE, 'utf8'));
const diffs = [];
for (const k of new Set([...Object.keys(before), ...Object.keys(now)])) {
  if (before[k] !== now[k]) diffs.push(`${k}: ${before[k] ? (now[k] ? 'MODIFIED' : 'DELETED') : 'ADDED'}`);
}
if (diffs.length) {
  console.log('UNTOUCHED_FAIL\n' + diffs.join('\n'));
  process.exit(1);
}
console.log(`UNTOUCHED_OK files=${Object.keys(now).length}`);
