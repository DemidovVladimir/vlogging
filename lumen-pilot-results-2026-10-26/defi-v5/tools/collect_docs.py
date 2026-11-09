"""Snapshot the official Aave/Kamino documentation indexes and in-scope pages.

Data only: never execute downloaded content. Preserve failures rather than silently
calling a partial corpus complete. Full means the current official llms.txt links
plus reachable same-site /docs Markdown links, not external repos/media/history.
"""
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit, unquote
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter
import hashlib, json, re, time, datetime

ROOT=Path(__file__).resolve().parents[1]
BASES={'aave':'https://aave.com','kamino':'https://kamino.com'}
MAX_PAGES=2000
MAX_PAGE_BYTES=2*1024**2
MAX_TOTAL_BYTES=160*1024**2
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(b):return hashlib.sha256(b).hexdigest()
def save(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')

def canonical(protocol,href,base):
    href=href.strip().strip('<>')
    if href.startswith(('#','mailto:','tel:','javascript:','data:')):return None
    u=urlsplit(urljoin(base,href));allowed=urlsplit(BASES[protocol])
    if u.scheme!='https' or u.netloc!=allowed.netloc or u.query:return None
    path=u.path.rstrip('/')
    if not path.startswith('/docs/') or '..' in unquote(path).split('/'):return None
    last=path.rsplit('/',1)[-1]
    if '.' in last and not last.endswith('.md'):return None
    if not path.endswith('.md'):path+='.md'
    return urlunsplit(('https',u.netloc,path,'',''))

def links(protocol,text,base):
    # Fenced code is not navigation. Keep ordinary Markdown and HTML doc links.
    text=re.sub(r'```.*?```','',text,flags=re.S)
    hrefs=re.findall(r'(?<!!)\[[^\]]*\]\(([^\s)]+)',text)
    hrefs+=re.findall(r'<a\s[^>]*href=[\"\']([^\"\']+)',text)
    return sorted({u for h in hrefs if (u:=canonical(protocol,h,base))})

def fetch(url):
    last=None
    for attempt in range(3):
      try:
        req=Request(url,headers={'User-Agent':'Local-DeFi-research-snapshot/1.0','Accept':'text/markdown,text/plain;q=0.9'})
        with urlopen(req,timeout=35) as r:
          data=r.read(MAX_PAGE_BYTES+1)
          if len(data)>MAX_PAGE_BYTES:raise ValueError('Page size limit exceeded')
          final=r.url;ct=r.headers.get('Content-Type','');status=r.status
        text=data.decode('utf-8')
        if text.lstrip().lower().startswith(('<!doctype html','<html')):raise ValueError('HTML returned instead of Markdown')
        if len(text.strip())<24:raise ValueError('Empty or suspiciously short Markdown')
        return {'url':url,'final_url':final,'status':status,'content_type':ct,'retrieved_at_utc':now(),'sha256':sha(data),'bytes':len(data)},data,text
      except Exception as e:
        last=f'{type(e).__name__}: {e}'
        if isinstance(e,HTTPError) and e.code in [400,401,403,404,410]:break
        time.sleep(attempt+1)
    return {'url':url,'error':last,'retrieved_at_utc':now()},None,None

def main():
    target=ROOT/'sources';target.mkdir(exist_ok=True)
    if (target/'corpus-manifest.json').exists():raise SystemExit('Existing snapshot; do not overwrite')
    manifest={'started_at_utc':now(),'scope':'All current llms.txt /docs links plus recursively reachable same-site Markdown documentation; no external source repositories, images, media, APIs, or history.','limits':{'max_pages':MAX_PAGES,'max_page_bytes':MAX_PAGE_BYTES,'max_total_bytes':MAX_TOTAL_BYTES},'indexes':{},'pages':[],'failed':[],'discovery':{}}
    pending=set();seed=set();seen=set();total=0;limit_hit=None
    for protocol,base in BASES.items():
      meta,data,text=fetch(base+'/docs/llms.txt')
      if data is None:raise SystemExit(meta)
      p=target/protocol/'llms.txt';p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
      meta['file']=str(p.relative_to(ROOT));initial=links(protocol,text,base+'/docs/llms.txt')
      meta['unique_markdown_pages']=len(initial);manifest['indexes'][protocol]=meta
      pending.update((protocol,u) for u in initial);seed.update((protocol,u) for u in initial)
    with ThreadPoolExecutor(max_workers=4) as pool:
      while pending:
        batch=sorted(pending);pending.clear()
        if len(seen)+len(batch)>MAX_PAGES:limit_hit='max_pages';break
        jobs={pool.submit(fetch,url):(protocol,url) for protocol,url in batch}
        for future in as_completed(jobs):
          protocol,url=jobs[future];seen.add((protocol,url));meta,data,text=future.result();meta['protocol']=protocol;meta['listed_in_llms']=(protocol,url) in seed
          if data is None:manifest['failed'].append(meta);continue
          if canonical(protocol,meta['final_url'],url) is None:
            manifest['failed'].append({**meta,'error':'Out-of-scope redirect'});continue
          total+=len(data)
          if total>MAX_TOTAL_BYTES:limit_hit='max_total_bytes';break
          relative=urlsplit(url).path.removeprefix('/docs/')
          p=target/protocol/'pages'/relative;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
          meta['file']=str(p.relative_to(ROOT));meta['title']=next((l.lstrip('# ').strip() for l in text.splitlines() if l.startswith('# ')),relative)
          meta['doc_id']=protocol+':'+relative
          meta['internal_doc_links']=len(links(protocol,text,url))
          manifest['pages'].append(meta)
          pending.update((protocol,u) for u in links(protocol,text,url) if (protocol,u) not in seen and (protocol,u) not in batch)
          if len(manifest['pages'])%40==0:print('Saved',len(manifest['pages']),'pages;',len(manifest['failed']),'failures;',len(pending),'new links',flush=True)
        save(target/'crawl-progress.json',{'at_utc':now(),'pages':len(manifest['pages']),'bytes':total,'failed':manifest['failed'],'pending':len(pending)})
        if limit_hit:break
    manifest['pages'].sort(key=lambda x:(x['protocol'],x['url']))
    manifest['failed'].sort(key=lambda x:(x['protocol'],x['url']))
    manifest.update(finished_at_utc=now(),saved_pages=len(manifest['pages']),saved_bytes=total,per_protocol=dict(Counter(x['protocol'] for x in manifest['pages'])),listed_pages=sum(x['listed_in_llms'] for x in manifest['pages']),failed_listed_pages=sum(x['listed_in_llms'] for x in manifest['failed']),limit_hit=limit_hit,complete_current_index=(not limit_hit and not any(x['listed_in_llms'] for x in manifest['failed'])),reachable_closure_complete=(not limit_hit and not manifest['failed']))
    save(target/'corpus-manifest.json',manifest)
    print(json.dumps({k:v for k,v in manifest.items() if k not in ['pages','failed','indexes']},ensure_ascii=False,indent=2),flush=True)
if __name__=='__main__':main()
