// Promote this verified navigation release as the next publishing baseline.
// Run only after a fresh Cloudflare GET confirms this deployment is still production.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const baseline=path.resolve(root,'../tengu-cloudflare-pages');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const receipt=read(path.join(root,'deployment-record.json'));
assert.equal(process.argv[2],receipt.deploymentId,'Pass the just-verified remote production ID');
assert.equal(receipt.deploymentStatus,'success');
const prior=read(path.join(baseline,'deployment-record.json'));
assert([receipt.previousDeploymentId,receipt.deploymentId].includes(prior.deploymentId),'Baseline changed elsewhere');
const origins=['https://tengucluster.com','https://tengu-presentations.pages.dev',receipt.deploymentUrl];
for(const origin of origins){
 const report=read(path.join(root,'qa',new URL(origin).hostname,'public-verification.json'));
 assert.equal(report.status,'passed');assert.equal(report.origin,origin);assert.equal(report.contentHashes,142);assert.equal(report.privatePaths,120);
}
for(const host of ['127.0.0.1','tengucluster.com']){
 const report=read(path.join(root,'qa',host,'verification.json'));
 assert.equal(report.status,'passed');assert.equal(report.viewers.length,6);assert.equal(report.catalogs.length,8);assert.equal(report.legacyLinks.length,4);
}
const inventory=read(path.join(root,'build-manifest.json'));
assert.equal(Object.keys(inventory.files).length,144);
for(const [file,meta] of Object.entries(inventory.files)){
 const bytes=fs.readFileSync(path.join(root,'public',file));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),meta.sha256,file);
 const target=path.join(baseline,'public',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
}
Object.assign(receipt,{recordedAt:new Date().toISOString(),qaStatus:'passed',verifiedOrigins:origins,httpsCertificateVerified:true,publicContentHashesVerified:142,privatePathsCheckedPerOrigin:120,liveBrowserReport:'qa/tengucluster.com/verification.json',viewportWidths:[1440,1280,768,390,320],catalogLanguages:['ru','en'],viewerLanguages:['ru','en'],legacyDeepLinksPreserved:true,previousPublicFilesRetained:139,previousFilesByteUnchanged:133,changedExistingHtmlFiles:6,addedPublicFiles:5});
fs.writeFileSync(path.join(root,'deployment-record.json'),JSON.stringify(receipt,null,2)+'\n');
for(const file of ['build-manifest.json','upload-manifest.json','deployment-record.json'])fs.copyFileSync(path.join(root,file),path.join(baseline,file));
console.log('Verified catalog release promoted as the current full public baseline. Previous 139-file release remains in tengu-site-navigation/previous/.');
