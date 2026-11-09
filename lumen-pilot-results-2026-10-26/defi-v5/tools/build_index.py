"""Local FTS5 index over full frozen docs and verified Ethereum specifications."""
from pathlib import Path
import hashlib,json,re,sqlite3,datetime
ROOT=Path(__file__).resolve().parents[1]
OLD=ROOT.parent/'audit-v4'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 manifest=json.loads((ROOT/'sources/corpus-manifest.json').read_text())
 docs=[]
 for r in manifest['pages']:
   path=ROOT/r['file'];assert sha(path)==r['sha256']
   version=('v3' if '/aave-v3/' in r['url'] else 'v4' if '/aave-v4' in r['url'] else 'shared') if r['protocol']=='aave' else 'snapshot-2026-10-27'
   docs.append({**{k:r[k] for k in ['doc_id','protocol','url','title','sha256','retrieved_at_utc']},'file':str(path.relative_to(ROOT)),'version':version,'text':path.read_text()})
 eth=json.loads((OLD/'crypto-corpus/corpus-manifest.json').read_text());seen=set()
 for r in eth['files']:
   m=r['frontmatter'];status=m.get('status','unparsed');proposal=m.get('eip','')
   if status=='Moved' or proposal in seen:continue
   seen.add(proposal);path=OLD/r['local_path'];assert sha(path)==r['sha256']
   docs.append({'doc_id':'ethereum:'+str(proposal),'protocol':'ethereum','url':r['url'],'title':m.get('title',''),'sha256':r['sha256'],'file':str(path.relative_to(ROOT.parent)).replace('audit-v4/','../audit-v4/',1),'version':status,'retrieved_at_utc':eth.get('completed_at_utc',eth.get('created_at_utc','2026-10-27')),'text':path.read_text()})
 dbpath=ROOT/'sources/search.sqlite';assert not dbpath.exists()
 db=sqlite3.connect(dbpath);db.execute('PRAGMA journal_mode=DELETE')
 db.execute('CREATE TABLE docs(doc_id TEXT PRIMARY KEY,protocol TEXT,title TEXT,url TEXT,version TEXT,file TEXT,sha256 TEXT,retrieved_at_utc TEXT)')
 db.execute("CREATE VIRTUAL TABLE chunks USING fts5(id UNINDEXED,doc_id UNINDEXED,part UNINDEXED,start_char UNINDEXED,end_char UNINDEXED,title,body,tokenize='unicode61')")
 chunk_count=0
 for d in docs:
   db.execute('INSERT INTO docs VALUES(?,?,?,?,?,?,?,?)',tuple(d[k] for k in ['doc_id','protocol','title','url','version','file','sha256','retrieved_at_utc']))
   words=list(re.finditer(r'\S+',d['text']))
   for part,start in enumerate(range(0,len(words),115)):
     end=min(start+150,len(words));a=words[start].start();b=words[end-1].end()
     body=d['text'][a:b]
     db.execute('INSERT INTO chunks VALUES(?,?,?,?,?,?,?)',(f"{d['doc_id']}#C{part:04d}",d['doc_id'],part,a,b,d['title'],body));chunk_count+=1
 db.commit();db.close()
 meta=[{k:v for k,v in d.items() if k!='text'} for d in docs]
 (ROOT/'sources/documents.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
 result={'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'documents':len(docs),'aave':sum(d['protocol']=='aave' for d in docs),'kamino':sum(d['protocol']=='kamino' for d in docs),'ethereum':sum(d['protocol']=='ethereum' for d in docs),'chunks':chunk_count,'chunking':'150 whitespace words with35 overlap, original character offsets retained','retrieval':'BM25 lexical FTS5 with fixed RU/EN domain dictionary; no embeddings or LLM','default_scope':'Question supplies protocol; Aave v3 only; Ethereum Final/Living; Kamino all collected pages','database_bytes':dbpath.stat().st_size,'sha256':sha(dbpath)}
 (ROOT/'sources/index-summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':main()
