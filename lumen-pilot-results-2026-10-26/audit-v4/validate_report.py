"""Static-only report QA; no browser, server or model execution."""
import collections, hashlib, json, re, subprocess, urllib.parse
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parent
class Page(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.hrefs=[];self.remote_assets=[];self.scripts=[];self.in_script=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='a' and 'href' in a:self.hrefs.append(a['href'])
  if tag in ('img','script','link'):
   for key in ('src','href'):
    if a.get(key,'').startswith(('http:','https:','//')):self.remote_assets.append(a[key])
  if tag=='script':self.in_script=True
 def handle_endtag(self,tag):
  if tag=='script':self.in_script=False
 def handle_data(self,data):
  if self.in_script:self.scripts.append(data)
p=Page();text=(ROOT/'report.html').read_text();p.feed(text)
errors=[]
counts=collections.Counter(p.ids)
errors += ['Duplicate ID: '+x for x,n in counts.items() if n>1]
for href in p.hrefs:
 url=urllib.parse.urlparse(href)
 if url.scheme or url.netloc:continue
 if href.startswith('#'):
  if href[1:] not in counts:errors.append('Missing anchor: '+href)
 elif not (ROOT/urllib.parse.unquote(url.path)).exists():errors.append('Missing local download: '+href)
if p.remote_assets:errors.append('Remote render assets: '+str(p.remote_assets))
# DOM IDs used as literal selectors must exist, apart from generated selector patterns.
script='\n'.join(p.scripts)
for id in re.findall(r"\$\('#([A-Za-z][A-Za-z0-9]*)'\)",script):
 if id not in counts:errors.append('Unknown JS selector: '+id)
if '__AB_' in text or '__DATA__' in text or '__CSS__' in text:errors.append('Unreplaced template placeholder')
js=ROOT/'report-static-check.js';js.write_text(script)
result=subprocess.run(['node','--check',str(js)],capture_output=True,text=True)
if result.returncode:errors.append(result.stderr)
d=json.loads((ROOT/'report-data.json').read_text())
assert len(d['historical'])==60
assert len({x['id'] for x in d['historical']})==60
assert sum(x['historical_full_answer_correct'] for x in d['historical'])==30
assert sum(x['content_only_correct'] for x in d['historical'])==35
assert sum(d['historical_summary']['primary_categories'].values())==60
for row in d['historical']:
 assert hashlib.sha256(row['raw'].encode()).hexdigest()==row['raw_sha256']
if not d['prompt_test']['pair_ready']:
 assert d['prompt_test']['state'] in ['pending','guard-stopped']
for key,value in d['historical_hashes'].items():
 assert hashlib.sha256((ROOT.parent/'v3'/key).read_bytes()).hexdigest()==value
output={'status':'PASS' if not errors else 'FAIL','scope':'static only; browser intentionally not run during MLX compute','ids':len(p.ids),'local_and_anchor_links':sum(not urllib.parse.urlparse(x).scheme for x in p.hrefs),'external_reference_links':sum(bool(urllib.parse.urlparse(x).scheme) for x in p.hrefs),'remote_render_assets':p.remote_assets,'js_syntax_pass':result.returncode==0,'all_60_raw_hashes_verified':True,'historical_full':30,'diagnostic_content':35,'prompt_test_state':d['prompt_test']['state'],'historical_files_unchanged':True,'errors':errors}
(ROOT/'static-validation.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(output,ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
