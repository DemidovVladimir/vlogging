// Read-only: every file of previous/ (production c2577349-a8bd-49ee-b455-d0172b047ca8) as served by the origin.
// Usage: node verify-baseline.mjs https://tengucluster.com
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const origin = process.argv[2]; assert(/^https:\/\//.test(origin));
const files = JSON.parse(fs.readFileSync(path.join(root, 'previous/build-manifest.json'))).files;
const jobs = Object.entries(files).filter(([f]) => !f.startsWith('_')).map(([file, meta]) => async () => {
  const r = await fetch(origin + '/' + file, {signal: AbortSignal.timeout(60000)});
  assert.equal(r.status, 200, file);
  assert.equal(crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'), meta.sha256, 'Live differs from previous/: ' + file);
});
const total = jobs.length;
await Promise.all(Array.from({length: 4}, async () => { while (jobs.length) await jobs.shift()(); }));
const result = {status: 'passed', origin, checkedAt: new Date().toISOString(), baselineDeploymentId: 'c2577349-a8bd-49ee-b455-d0172b047ca8', filesMatched: total};
const out = path.join(root, 'qa', new URL(origin).hostname); fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'baseline-verification.json'), JSON.stringify(result, null, 2) + '\n');
console.log(result);
