"""Fetch pinned CC0 text only; no assets, history, credentials, packages or code execution."""
import concurrent.futures
import datetime
import hashlib
import json
import time
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
DEST=ROOT/'crypto-corpus'
INDEXES=[json.loads((ROOT/'data-sources'/n).read_text()) for n in ['EIPs-index.json','ERCs-index.json']]
assert sum(x['total_markdown_bytes'] for x in INDEXES)<24*2**20

def fetch(item):
    record,entry=item
    folder=record['repo'].split('/')[1]
    path=DEST/folder/entry['path']
    assert path.resolve().is_relative_to(DEST.resolve())
    error=None
    for attempt in range(3):
        try:
            if path.exists():
                body=path.read_bytes()
            else:
                req=urllib.request.Request(entry['url'],headers={'User-Agent':'TENGU-local-research/1.0'})
                with urllib.request.urlopen(req,timeout=20) as r: body=r.read(1024*1024+1)
            assert len(body)<=1024*1024
            assert len(body)==entry['bytes'], 'size mismatch'
            gitsha=hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest()
            assert gitsha==entry['git_blob_sha'], 'git blob hash mismatch'
            text=body.decode('utf-8')
            path.parent.mkdir(parents=True,exist_ok=True)
            if not path.exists(): path.write_bytes(body)
            front=text.split('---',2)[1] if text.startswith('---') else ''
            meta={}
            for line in front.splitlines():
                if ':' in line:
                    k,v=line.split(':',1)
                    if k in ['eip','title','status','type','category','created','requires']: meta[k]=v.strip().strip('"')
            return {**entry,'local_path':str(path.relative_to(ROOT)),'repo':record['repo'],
                    'commit_revision':record['commit_revision'],'sha256':hashlib.sha256(body).hexdigest(),
                    'frontmatter':meta,'status':'downloaded_verified'}
        except Exception as exc:
            error=str(exc)
            if attempt<2: time.sleep(0.3*(attempt+1))
    return {**entry,'repo':record['repo'],'status':'failed','error':error}

def main():
    DEST.mkdir(exist_ok=True)
    jobs=[(record,entry) for record in INDEXES for entry in record['files']]
    rows=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for n,row in enumerate(pool.map(fetch,jobs),1):
            rows.append(row)
            if n%200==0 or n==len(jobs): print(n,'/',len(jobs),flush=True)
    good=[r for r in rows if r['status']=='downloaded_verified']
    statuses={}
    for r in good:
        k=r['frontmatter'].get('status','unparsed');statuses[k]=statuses.get(k,0)+1
    licenses=[]
    for record in INDEXES:
        req=urllib.request.Request(record['license_url'],headers={'User-Agent':'TENGU-local-research/1.0'})
        with urllib.request.urlopen(req,timeout=20) as r: body=r.read(65537)
        assert len(body)<65537 and b'CC0' in body
        p=DEST/record['repo'].split('/')[1]/'LICENSE.md';p.write_bytes(body)
        licenses.append({'repo':record['repo'],'url':record['license_url'],'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(body).hexdigest(),'license':'CC0-1.0'})
    manifest={'retrieved_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'expected_files':len(jobs),'verified_files':len(good),'verified_bytes':sum(r['bytes'] for r in good),
              'failed_files':len(rows)-len(good),'status':'complete' if len(good)==len(rows) else 'partial',
              'frontmatter_status_counts_raw':statuses,'licenses':licenses,'files':rows,
              'caution':'Raw files include migration stubs, overlapping proposal IDs, Draft/Withdrawn/Stagnant items. Do not call all files implemented or independent standards. Corpus size is not an LLM quality score.'}
    (DEST/'corpus-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in manifest.items() if k not in ['files','licenses']},ensure_ascii=False),flush=True)

if __name__=='__main__':main()
