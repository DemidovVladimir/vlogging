// Promote only a hash-verified and browser-tested complete public snapshot.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),baseline=path.resolve(root,'../tengu-cloudflare-pages');
const read=f=>JSON.parse(fs.readFileSync(f)),write=(f,x)=>fs.writeFileSync(f,JSON.stringify(x,null,2)+'\n');
const receipt=read(root+'/deployment-record.json'),old=read(baseline+'/deployment-record.json');
assert([receipt.previousDeploymentId,receipt.deploymentId].includes(old.deploymentId),'Reconcile newer local baseline');
const origins=['tengucluster.com','tengu-presentations.pages.dev','213faf4e.tengu-presentations.pages.dev'];
for(const host of origins){const q=read(root+'/qa/'+host+'/public-verification.json');assert(q.status==='passed'&&q.contentHashes===142&&q.privatePaths===128);}
const browser=read(root+'/qa/tengucluster.com/technical-qa.json');assert(browser.status==='passed'&&browser.editions.length===4);
const manifest=read(root+'/build-manifest.json'),previous=read(root+'/previous/build-manifest.json');
for(const [f,m]of Object.entries(manifest.files)){
 const b=fs.readFileSync(root+'/public/'+f);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),m.sha256,f);
 fs.mkdirSync(path.dirname(baseline+'/public/'+f),{recursive:true});fs.writeFileSync(baseline+'/public/'+f,b);
}
for(const f of ['episodes/agent-context/index.html','en/episodes/agent-context/index.html','index.html','en/index.html'])assert.deepEqual(manifest.files[f],previous.files[f]);
Object.assign(receipt,{status:'success',verifiedAt:new Date().toISOString(),staticAssets:142,controlFiles:2,privatePaths404PerOrigin:128,verifiedOrigins:origins,qa:'qa/tengucluster.com/technical-qa.json',harnessSourceCommit:'9805470d751bc7fb18b4fa96153c1b095cdb73e6',manifest:'build-manifest.json',sourceWorkspace:root,rollbackSnapshot:'previous/public',editorial:read(root+'/qa/editorial-checks.json')});
write(root+'/deployment-record.json',receipt);write(baseline+'/deployment-record.json',receipt);
for(const file of ['build-manifest.json','upload-manifest.json'])fs.copyFileSync(root+'/'+file,baseline+'/'+file);
fs.writeFileSync(baseline+'/README-RU.md',`# TENGU — текущий Cloudflare Pages baseline

Проверенный полный снимок: public/, 144 файла (142 static + _headers/_redirects).
Релиз ${receipt.deploymentId}; предыдущий ${receipt.previousDeploymentId}.
Основной адрес https://tengucluster.com, проект tengu-presentations, production main.

## Маршруты

/ — RU-каталог; /en/ — EN-каталог. /ru и /ru/ перенаправляют на /.
EP.01: /episodes/agent-context/ и /en/episodes/agent-context/.
EP.02: /episodes/tengu-cluster/ и /en/episodes/tengu-cluster/.
EP.03: /episodes/emudhra-ca-compromise/ и /en/episodes/emudhra-ca-compromise/.
Старые корневые #slide-N и #intro ведут в EP.01 с сохранением query/hash.

EP.02/03 технически переработаны 23 октября; EP.01, каталоги и меню побайтно сохранены.
Меню каждого viewer перечисляет все три выпуска; переключатель языка сохраняет слайд. H / record=1 скрывает навигацию при записи.

## Следующий релиз

Использовать актуальный artifact-template-tengu-youtube в Codex или Claude. Добавлять каждую новую языковую пару в оба каталога и ВСЕ меню. Проверять scripts/check-navigation.mjs и audit-public.mjs из скилла.
Рабочие сценарии, планы, SOURCES, skill, QA и manifests не публикуются. Только явный allowlist. Новый Pages deploy заменяет весь сайт; начинать с этого полного снимка, сверить удалённый production ID непосредственно перед upload/deploy.

Исходники навигации: ../tengu-site-navigation/. Его старый build.mjs привязан к историческому snapshot; не запускать без адаптации. Здесь build.mjs и upload-assets.mjs тоже исторические (EP.01/33 assets), не использовать для многовыпускного сайта.
Последняя сборка, QA, приватные snapshots и receipt: ../tengu-technical-revision/. Его build.mjs также воспроизводит именно этот релиз, не универсальный последующий.

Три origin проверены по хешам и 128 приватным путям на каждом. Сценарии остаются в ../tengu-cluster-episode/{ru,en}/ и ../tengu-emudhra-episode/{ru,en}/. DNS не менялся. Старый снимок для восстановления: ../tengu-technical-revision/previous/public/.
`);
fs.writeFileSync(root+'/README.md',`# TENGU technical revision — 23 October 2026

Published and verified: ${receipt.deploymentId}
https://tengucluster.com/episodes/tengu-cluster/ (EN: /en/episodes/tengu-cluster/)
https://tengucluster.com/episodes/emudhra-ca-compromise/ (EN: /en/episodes/emudhra-ca-compromise/)

16 viewer resources changed. EP.01, catalogs, navigation, shared branding/media and hosting controls remain byte-identical. Authoritative current site snapshot: ../tengu-cloudflare-pages/. This folder preserves this specific release and its prior baseline.

Source inputs: ../tengu-cluster-episode/technical-content.mjs and ../tengu-emudhra-episode/technical-content.mjs, their author.mjs/CSS/renderers. Scripts, director plans, source ledgers and this folder's operational records stay private. Never upload either episode's working dist directory.

QA: four localized decks, every animation phase forward/back, P/R/rate controls, recording mode, menu inertness, intro audio, desktop 720p/1080p and mobile layout. Three HTTPS origins: 142 static hashes plus 128 private 404 probes each. See qa/.

Skill: same SKILL.md, publishing/production guidance and check-navigation.mjs installed in ~/.codex/skills/artifact-template-tengu-youtube and ~/.claude/skills/artifact-template-tengu-youtube; local kit/ZIP updated. Validated in each location. test-skill.mjs tests a new bilingual episode fixture and rejects missing catalog/menu entries, a bad language target and private navigation links. Test fixture is temporary and was never uploaded.

Timing estimates (not a measured presenter read): Cluster RU 5:01 / EN 5:56; eMudhra RU 5:09 / EN 5:40. Intro/pauses included.

Reproduction: author the episode(s), build.mjs stages the fixed prior snapshot, verify.cjs tests the staged site at loopback port 4177, release-check.mjs runs editorial/privacy/navigation gates. upload-assets.mjs uses only a short-lived stdin token with terminal echo disabled. Never print or save credentials. finalize.mjs requires completed live QA. All scripts here are snapshot-specific; reconcile the latest production state before a later release.

Recovery: previous/public is the full former site; previous/cluster-source and previous/emudhra-source are private source backups; previous/tengu-youtube-skill.zip is the old skill package. Nothing material was deleted. The actual Tengu Cluster repository was inspected read-only.
`);
console.log('Promoted verified complete baseline; previous release and private sources preserved.');
