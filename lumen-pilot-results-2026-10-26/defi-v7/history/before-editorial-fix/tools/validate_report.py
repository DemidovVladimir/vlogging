"""Check frozen evidence, report files and controls without running inference."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote,urlsplit
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[1];OLD=ROOT.parent/'defi-v5';SMALL=ROOT.parent/'defi-v6/selection'
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
class Scan(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.links=[];self.assets=[]
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if 'id'in a:self.ids.append(a['id'])
  if 'href'in a:self.links.append(a['href'])
  if t in ['script','img','iframe','link'] and ('src'in a or 'href'in a):self.assets.append(a.get('src',a.get('href')))
def main():
 h=(ROOT/'report.html').read_text();s=Scan();s.feed(h);assert len(s.ids)==len(set(s.ids)) and not s.assets
 local=0
 for href in s.links:
  u=urlsplit(href)
  if u.scheme in ['https','http']:continue
  if href.startswith('#'):assert href[1:]in s.ids;continue
  assert not u.scheme and (ROOT/unquote(u.path)).is_file(),href;local+=1
 assert '/*INLINE_'not in h and 'REPORT_DATA_JSON'not in h
 d=read(ROOT/'report-data.json');g=read(ROOT/'runs/grades.json');assert d['larger']==g['summary']['larger']
 assert d['small']==read(SMALL/'runs/grades.json')['summary']['selection'] and len(d['questions'])==60
 assert g['semantic_review_complete'] and len(g['items'])==60
 for q in d['questions']:
  assert set(q['modes'])=={'small','larger'}
  for c in q['context']:
   text=(ROOT/c['local_href']).read_text();assert text[int(c['start_char']):int(c['end_char'])]==c['text']
 for row in g['items']:
  if row['fully_grounded']is not None:assert row['fully_grounded']==(row['content_correct'] and row['quote_valid'] and row['citation_supported']is True)
 b=read(ROOT/'baseline-freeze.json')
 assert all(sha(OLD/f)==v for f,v in b['v5'].items()) and all(sha(SMALL/f)==v for f,v in b['small'].items())
 f=read(ROOT/'execution/freeze.json');assert all(sha(ROOT/'execution'/n)==v for n,v in f['files'].items())
 docs=read(OLD/'sources/documents.json');assert all(sha(OLD/d['file'])==d['sha256'] for d in docs)
 cleanup=read(ROOT/'cleanup.json');assert cleanup['runtime_removed'] and not Path(cleanup['runtime']).exists() and cleanup['owned_jobs_remaining']==0
 assert not list(ROOT.rglob('*.safetensors')) and not list(ROOT.rglob('__pycache__')) and not list(ROOT.rglob('.venv'))
 subprocess.run(['node','--check',str(ROOT/'tools/report.js')],check=True)
 ui=subprocess.run(['node',str(ROOT/'tools/check_ui.js')],check=True,capture_output=True,text=True)
 result={'status':'PASS','scope':'Static and DOM-state simulation, no browser rendering/server/model','ids':len(s.ids),'local_links':local,'external_render_assets':s.assets,'documents_sha_verified':len(docs),'source_char_spans_exact':True,'frozen_execution_files_verified':len(f['files']),'baseline_files_unchanged':True,'questions':60,'new_model_answers':60,'human_validation':False,'js_syntax':True,'ui_checks':json.loads(ui.stdout),'cleanup_verified':True,'errors':[]}
 (ROOT/'static-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
