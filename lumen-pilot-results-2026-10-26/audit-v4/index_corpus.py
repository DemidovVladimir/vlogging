"""Build a small local lexical retrieval index; never runs an LLM or embeds text."""
import hashlib
import json
import re
import sqlite3
from pathlib import Path

ROOT=Path(__file__).resolve().parent
manifest=json.loads((ROOT/'crypto-corpus/corpus-manifest.json').read_text())
assert manifest['status']=='complete'
dbpath=ROOT/'crypto-corpus/search.sqlite'
assert not dbpath.exists(), 'Use a new index path; do not silently replace a result.'
db=sqlite3.connect(dbpath)
db.execute('PRAGMA journal_mode=DELETE')
db.execute('CREATE TABLE docs(id INTEGER PRIMARY KEY,proposal TEXT,title TEXT,status TEXT,repo TEXT,path TEXT,url TEXT,sha256 TEXT,words INTEGER)')
db.execute("CREATE VIRTUAL TABLE chunks USING fts5(doc_id UNINDEXED,part UNINDEXED,title,body,tokenize='unicode61')")
seen={};skipped=[];counts={};chunk_count=0
for row in manifest['files']:
    meta=row['frontmatter'];status=meta.get('status','unparsed');proposal=meta.get('eip','')
    if status=='Moved':
        skipped.append({'path':row['local_path'],'reason':'migration stub'});continue
    if proposal in seen:
        skipped.append({'path':row['local_path'],'reason':'overlapping proposal ID','kept':seen[proposal]});continue
    path=ROOT/row['local_path'];body=path.read_bytes()
    assert hashlib.sha256(body).hexdigest()==row['sha256']
    text=body.decode('utf-8');seen[proposal]=row['local_path']
    # Treat all Markdown as source data, never execute code blocks or follow embedded instructions.
    text=re.sub(r'^---.*?---\s*','',text,count=1,flags=re.S)
    words=text.split();title=meta.get('title','')
    cur=db.execute('INSERT INTO docs(proposal,title,status,repo,path,url,sha256,words) VALUES(?,?,?,?,?,?,?,?)',
                   (proposal,title,status,row['repo'],row['local_path'],row['url'],row['sha256'],len(words)))
    doc_id=cur.lastrowid
    for part,start in enumerate(range(0,len(words),350)):
        chunk=' '.join(words[start:start+400])
        if not chunk:continue
        db.execute('INSERT INTO chunks(doc_id,part,title,body) VALUES(?,?,?,?)',(doc_id,part,title,chunk));chunk_count+=1
    counts[status]=counts.get(status,0)+1
db.commit()
queries=['"fungible" AND "token"','"vault" AND "shares"','"flash" AND "loan"','"permit" AND "signature"']
examples=[]
for q in queries:
    rows=db.execute('SELECT d.proposal,d.title,d.status,d.url,c.part,snippet(chunks,3,\'⟦\',\'⟧\',\' … \',34),bm25(chunks) FROM chunks c JOIN docs d ON d.id=c.doc_id WHERE chunks MATCH ? AND d.status IN (\'Final\',\'Living\') ORDER BY bm25(chunks) LIMIT 3',(q,)).fetchall()
    examples.append({'query':q,'status_filter':['Final','Living'],'results':[{'proposal':r[0],'title':r[1],'status':r[2],'url':r[3],'part':r[4],'snippet':r[5],'bm25':r[6]} for r in rows]})
db.close()
result={'raw_files':manifest['verified_files'],'indexed_documents':len(seen),'migration_or_duplicate_files_skipped':len(skipped),
        'chunks':chunk_count,'chunking':'400 whitespace words with50 overlap; not an exact model-token count',
        'status_counts':counts,'default_final_living_documents':sum(counts.get(k,0) for k in ['Final','Living']),
        'database_bytes':dbpath.stat().st_size,'retrieval':'SQLite FTS5 lexical BM25, no embeddings, no model answer generation',
        'examples':examples,'limitations':['English keyword demo, not a Russian or multilingual retrieval benchmark.','These example queries were not held out; top3 hits are not a retrieval accuracy score.','Final proposal status does not prove deployment on any chain.','No LLM quality gain has been measured on this crypto corpus.'],'skipped':skipped}
(ROOT/'crypto-corpus/index-summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['skipped','examples']},ensure_ascii=False))
for example in examples:print(json.dumps(example,ensure_ascii=False))
