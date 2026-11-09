"""Offline integrity and static report validation, no browser or model."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote,urlsplit
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[1];OLD=ROOT.parent/'defi-v5'
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
class Scan(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.links=[];self.assets=[]
 def handle_starttag(self,tag,attrs):
   a=dict(attrs)
   if 'id' in a:self.ids.append(a['id'])
   if 'href' in a:self.links.append(a['href'])
   if tag in ['script','img','iframe','link'] and ('src' in a or 'href' in a):self.assets.append(a.get('src',a.get('href')))
def main():
 h=(ROOT/'report.html').read_text();s=Scan();s.feed(h);assert len(s.ids)==len(set(s.ids))
 local=0
 for href in s.links:
   u=urlsplit(href)
   if u.scheme in ['http','https']:continue
   if href.startswith('#'):assert href[1:] in s.ids,href;continue
   assert not u.scheme and (ROOT/unquote(u.path)).exists(),href;local+=1
 assert not s.assets,s.assets
 assert 'REPORT_DATA_JSON' not in h and '/*INLINE_' not in h
 data=read(ROOT/'report-data.json');g=read(ROOT/'runs/grades.json')
 assert len(data['questions'])==60 and len(g['items'])==180 and g['semantic_review_complete']
 assert data['baseline_summary']==g['baseline_summary']
 for a in g['summary']:assert data['summary'][a]==g['summary'][a]
 follow=ROOT/'selection';fg=read(follow/'runs/grades.json');assert len(fg['items'])==60 and fg['semantic_review_complete']
 assert data['summary']['selection']==fg['summary']['selection']
 ff=read(follow/'execution/freeze.json');assert all(sha(follow/'execution'/n)==want for n,want in ff['files'].items())
 fc=read(follow/'cleanup.json');assert fc['runtime_removed'] and not Path(fc['runtime']).exists()
 for q in data['questions']:
   assert len(q['modes'])==7
   for m in q['modes'].values():
     for ref in m['context']:
       p=(ROOT/ref['local_href']).resolve();assert p.is_file()
       text=p.read_text();assert text[int(ref['start_char']):int(ref['end_char'])]==ref['text'],(q['id'],ref['id'])
 for r in g['items']:
   if r['fully_grounded'] is not None:assert r['fully_grounded']==(r['content_correct'] and r['quote_valid'] and r['citation_supported'] is True)
 baseline=read(ROOT/'baseline-freeze.json');assert all(sha(OLD/name)==want for name,want in baseline['files'].items())
 frozen=read(ROOT/'execution/freeze.json');assert all(sha(ROOT/'execution'/name)==want for name,want in frozen['files'].items())
 docs=read(OLD/'sources/documents.json');assert all(sha(OLD/d['file'])==d['sha256'] for d in docs)
 cleanup=read(ROOT/'cleanup.json');assert cleanup['runtime_removed'] and cleanup['owned_jobs_remaining']==0 and not Path(cleanup['runtime']).exists()
 assert not list(ROOT.rglob('*.safetensors')) and not list(ROOT.rglob('__pycache__')) and not list(ROOT.rglob('.venv'))
 subprocess.run(['node','--check',str(ROOT/'tools/report.js')],check=True)
 ui=subprocess.run(['node',str(ROOT/'tools/check_ui.js')],capture_output=True,text=True,check=True)
 result={'status':'PASS','scope':'Static and lightweight DOM-state simulation only; no browser rendering, server or model','html_ids':len(s.ids),'local_links':local,'external_render_assets':s.assets,'documents_sha_verified':len(docs),'source_char_spans_all_exact':True,'frozen_execution_files_verified':len(frozen['files']),'baseline_files_unchanged':True,'new_raw_answers':240,'historical_raw_answers':180,'js_syntax':True,'ui_state_checks':json.loads(ui.stdout),'cleanup_verified':True,'errors':[]}
 (ROOT/'static-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
