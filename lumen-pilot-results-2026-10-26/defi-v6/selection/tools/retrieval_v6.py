"""Section-aware lexical retrieval. Only visible question/protocol; never gold.

No learned reranker, embeddings, LLM rewrite or per-question routing table.
"""
import hashlib,json,math,re,sqlite3
from pathlib import Path
from retrieval_v5 import ALIASES,STOP

EXTRA={
 'ждать':['maturity','term','repay'], 'срок':['term','maturity'],
 'погас':['repay','repayment'], 'коррел':['correlated'],
 'необеспеч':['unsecured','collateral'], 'очеред':['queue','queued','withdrawal'],
 'фиксирован':['fixed'], 'частичн':['partial'], 'заверш':['end'],
 'откат':['revert'], 'баланс':['balance'], 'увелич':['increase'],
 'уменьш':['decrease'], 'накапл':['accrue'], 'начисл':['accrue','interest'],
 'окончан':['maturity'], 'пересчет':['conversion'], 'отключ':['disabled'],
 'необязат':['optional'], 'кошель':['wallet'], 'обновл':['update'],
 'прибав':['add'], 'замен':['overwrite','replace'], 'досроч':['early','repay'],
 'предупрежд':['warning'], 'период':['period'], 'фиксир':['fixed'],
 'корзин':['borrowable'], 'произвольн':['any'], 'внес':['supply','deposit'],
 'спред':['spread'], 'незанят':['idle'], 'простоя':['idle'],
 'погашен':['repayment'], 'рыночн':['market'], 'ликвидац':['liquidation'],
}
STOP=STOP|{'evm','hf','ltv','usdc','usd','pool','of','to','in','is','it','or','by','as','be','at','for','an','my','raw','units','pct','must','true','false','max','total','value','per','count'}
STOP=STOP-{'ltv','hf'}
PHRASES=['health factor','debt ceiling','isolation mode','siloed borrowing','borrow factor',
 'current ltv','max ltv','liquidation ltv','cross mode','repay with collateral',
 'fixed rates','early repay penalty','queued withdrawal','supply cap','borrow cap',
 'liquidation bonus','collateral value','risk-adjusted debt','deposit fees','deposit limits']

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def words(s):return re.findall(r'[a-z][a-z0-9]*',s.casefold())
def sections(text):
    headings=list(re.finditer(r'(?m)^#{1,6} +([^\n]+)',text))
    boundaries=[(0,'Introduction')]+[(m.start(),m.group(1).strip()) for m in headings]
    for i,(start,title) in enumerate(boundaries):
      end=boundaries[i+1][0] if i+1<len(boundaries) else len(text)
      if end<=start:continue
      # Section boundaries are respected. Word windows retain exact char spans.
      ww=list(re.finditer(r'\S+',text[start:end]))
      for j in range(0,len(ww),130):
        group=ww[j:j+170]
        if not group:continue
        a=start+group[0].start();b=start+group[-1].end()
        yield title,a,b,text[a:b]
        if j+170>=len(ww):break

def build_index(source_root,db_path):
    docs=json.loads((source_root/'sources/documents.json').read_text())
    db=sqlite3.connect(db_path)
    db.executescript('''CREATE TABLE docs(doc_id TEXT PRIMARY KEY,protocol TEXT,title TEXT,url TEXT,version TEXT,file TEXT,sha256 TEXT,retrieved_at_utc TEXT);
      CREATE VIRTUAL TABLE chunks USING fts5(id UNINDEXED,doc_id UNINDEXED,start_char UNINDEXED,end_char UNINDEXED,title,section,body,tokenize='unicode61');''')
    count=0
    for d in docs:
      p=source_root/d['file'];assert sha(p)==d['sha256']
      db.execute('INSERT INTO docs VALUES(?,?,?,?,?,?,?,?)',[d[k] for k in ['doc_id','protocol','title','url','version','file','sha256','retrieved_at_utc']])
      for i,(section,a,b,body) in enumerate(sections(p.read_text())):
        db.execute('INSERT INTO chunks VALUES(?,?,?,?,?,?,?)',(d['doc_id']+':s'+str(i),d['doc_id'],a,b,d['title'],section,body));count+=1
    db.execute("CREATE VIRTUAL TABLE vocab USING fts5vocab(chunks,'row')")
    db.commit();db.close()
    return {'documents':len(docs),'chunks':count,'database_sha256':sha(db_path),'algorithm':'Markdown sections;170word windows/40word overlap, never cross a heading'}

def features(question):
    low=question.casefold();groups=[];seen=set()
    def add(terms,weight,kind):
      key=tuple(terms)
      if key and key not in seen:groups.append({'terms':list(key),'weight':weight,'kind':kind});seen.add(key)
    for token in re.findall(r'[A-Za-z][A-Za-z0-9_]*',question):
      if token.casefold() in STOP or re.fullmatch(r'(erc|eip)\d+',token,re.I):continue
      # Exact method names dominate broad words, without knowing any answer.
      identifier=bool(re.search(r'[a-z][A-Z]|_',token)) or token.casefold() in ['decimals','allowance','approval','emode','atoken','atokens','rollover','utilization']
      add([token.casefold()],4.0 if identifier else 1.6,'identifier' if identifier else 'english')
    for phrase in PHRASES:
      if phrase in low:add([phrase],3.0,'phrase')
    for stem,translations in {**ALIASES,**EXTRA}.items():
      if stem in low:
        terms=[x for x in translations if x not in STOP]
        if terms:add(terms,.8,'translation')
    return groups

def search(db_path,protocol,question,k=3):
    groups=features(question);terms=list(dict.fromkeys(t for g in groups for t in g['terms']))
    if not terms:return {'features':groups,'hits':[]}
    match=' OR '.join('"'+t.replace('"','""')+'"' for t in terms)
    sql='''SELECT c.id,c.doc_id,c.start_char,c.end_char,c.title,c.section,c.body,d.url,d.version,d.file,d.sha256,d.retrieved_at_utc,bm25(chunks,0,0,0,0,3,5,1) AS bm25 FROM chunks c JOIN docs d ON c.doc_id=d.doc_id WHERE chunks MATCH ? AND d.protocol=?'''
    vals=[match,protocol]
    if protocol=='aave':sql+=" AND d.version='v3'"
    if protocol=='ethereum':
      sql+=" AND d.version IN ('Final','Living')"
      standards=re.findall(r'\b(?:erc|eip)[ -]?(\d+)\b',question,re.I)
      if len(set(standards))==1:sql+=' AND d.doc_id=?';vals.append('ethereum:'+standards[0])
    sql+=' ORDER BY bm25 ASC,c.id ASC LIMIT 80'
    with sqlite3.connect(db_path) as db:
      db.row_factory=sqlite3.Row;candidates=[dict(r) for r in db.execute(sql,vals)]
    for rank,c in enumerate(candidates):
      body=c['body'].casefold();head=(c['title']+' '+c['section']).casefold()
      score=2/(rank+4);matched=[]
      for g in groups:
        # Whole identifiers/phrases, not substrings such as repay inside prepay.
        pattern=lambda t:r'(?<![a-z0-9_])'+re.escape(t)+r'(?![a-z0-9_])'
        inbody=any(re.search(pattern(t),body) for t in g['terms'])
        inhead=any(re.search(pattern(t),head) for t in g['terms'])
        if inbody or inhead:
          score+=g['weight']*(int(inbody)+1.7*int(inhead));matched.append(g['terms'])
      c.update(rerank_score=score,matched_features=matched,bm25_rank=rank+1)
    chosen=[]
    for c in sorted(candidates,key=lambda x:(-x['rerank_score'],x['bm25_rank'],x['id'])):
      if any(c['doc_id']==p['doc_id'] and max(0,min(int(c['end_char']),int(p['end_char']))-max(int(c['start_char']),int(p['start_char'])))>0.25*min(len(c['body']),len(p['body'])) for p in chosen):continue
      chosen.append(c)
      if len(chosen)==k:break
    return {'features':groups,'match_expression':match,'candidate_count':len(candidates),'hits':chosen,'candidate_top10':[{'id':c['id'],'doc_id':c['doc_id'],'section':c['section'],'score':c['rerank_score']} for c in sorted(candidates,key=lambda x:-x['rerank_score'])[:10]]}
