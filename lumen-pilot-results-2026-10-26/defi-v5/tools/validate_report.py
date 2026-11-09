"""Static QA only. Does not launch a browser, server or model."""
import collections, hashlib, json, re, subprocess, urllib.parse
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.links=[];self.scripts=[];self.active=False;self.remote=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if 'id'in d:self.ids.append(d['id'])
  if tag=='a' and'href'in d:self.links.append(d['href'])
  if tag in ['script','img','link']:
   for k in ['src','href']:
    if d.get(k,'').startswith(('http:','https:','//')):self.remote.append(d[k])
  if tag=='script':self.active=True
 def handle_endtag(self,tag):
  if tag=='script':self.active=False
 def handle_data(self,x):
  if self.active:self.scripts.append(x)
p=Page();text=(ROOT/'report.html').read_text();p.feed(text);errors=[]
ids=collections.Counter(p.ids)
errors+=['Duplicate ID '+k for k,v in ids.items()if v>1]
for href in p.links:
 u=urllib.parse.urlparse(href)
 if u.scheme or u.netloc:continue
 if href.startswith('#'):
  if href[1:]not in ids:errors.append('Missing anchor '+href)
 elif not(ROOT/urllib.parse.unquote(u.path)).exists():errors.append('Missing local file '+href)
script='\n'.join(p.scripts)
for id in re.findall(r"\$\('#([A-Za-z][A-Za-z0-9]*)'\)",script):
 if id not in ids:errors.append('Unknown literal JS selector '+id)
if p.remote:errors.append('Remote render assets')
if '__DATA__'in text or '__CSS__'in text or '__DOWNLOADS__'in text:errors.append('Unreplaced template placeholder')
js=ROOT/'tools/report-static-check.js';js.write_text(script)
check=subprocess.run(['node','--check',str(js)],capture_output=True,text=True)
if check.returncode:errors.append(check.stderr)
d=json.loads((ROOT/'report-data.json').read_text())
if d['exam_complete']:
 if len(d['tests'])!=60 or len({t['id']for t in d['tests']})!=60:errors.append('Exam is not unique60')
 if sum(t['gold']['status']=='known'for t in d['tests'])!=52:errors.append('Expected52known')
 if sum(t['gold']['status']=='unknown'for t in d['tests'])!=8:errors.append('Expected8unknown')
for k,a in d['arms'].items():
 if not a['complete'] and any(a['score'][s]is not None for s in ['content','grounded_known','unknown']):errors.append(k+': incomplete arm has numeric score')
verified=0
for doc in d['documents']:
 path=ROOT/doc['file']
 if not path.exists():errors.append('Missing source '+doc['doc_id']);continue
 if hashlib.sha256(path.read_bytes()).hexdigest()!=doc['sha256']:errors.append('Source SHA mismatch '+doc['doc_id'])
 else:verified+=1
result={'status':'FAIL'if errors else'PASS','scope':'Static only; no browser/server/model','ids':len(ids),'local_links':sum(not urllib.parse.urlparse(x).scheme for x in p.links),'js_syntax':check.returncode==0,'remote_render_assets':p.remote,'documents_sha_verified':verified,'exam_count':len(d['tests']),'state':d['state'],'scores_pending_for_incomplete_arms':True,'errors':errors}
(ROOT/'static-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(bool(errors))
