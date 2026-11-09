"""Mechanical metrics only. This never substitutes for semantic answer review."""
from pathlib import Path
import hashlib,json,math,re,collections
ROOT=Path(__file__).resolve().parents[1]
ARMS=['closed','oracle','retrieved']
def rows(p):return [json.loads(s) for s in p.read_text().splitlines() if s.strip()] if p.exists() else []
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def norm(s):return ' '.join(s.split())
def equal(a,b):
 if isinstance(b,bool):return type(a) is bool and a==b
 if isinstance(b,(int,float)):
   return type(a) in [int,float] and math.isfinite(a) and abs(a-b)<=max(1e-6,abs(b)*1e-6)
 if isinstance(b,str):return isinstance(a,str) and a.strip().casefold()==b.strip().casefold()
 if isinstance(b,dict):return isinstance(a,dict) and a.keys()==b.keys() and all(equal(a[k],v) for k,v in b.items())
 return a==b
def parse(raw):
 try:
   def unique(pairs):
     out={}
     for k,v in pairs:
       if k in out:raise ValueError('Duplicate JSON key')
       out[k]=v
     return out
   x=json.loads(raw.strip(),object_pairs_hook=unique,parse_constant=lambda x:(_ for _ in ()).throw(ValueError(x)))
   return x if isinstance(x,dict) else None
 except (ValueError,TypeError):return None
def covered(a,b,spans):
 cursor=a
 for s,e in sorted(spans):
   if e<=cursor:continue
   if s>cursor:return False
   cursor=max(cursor,e)
   if cursor>=b:return True
 return cursor>=b

def main():
 tests=rows(ROOT/'exam/test.jsonl');ctx={(r['id'],r['arm']):r for r in rows(ROOT/'inputs/contexts.jsonl')}
 checks=[];rawhash={};counts={}
 for arm in ARMS:
   p=ROOT/'runs'/f'{arm}.jsonl';rr=[r for r in rows(p) if 'id' in r];counts[arm]=len(rr)
   if p.exists():rawhash[arm]=sha(p)
   for r in rr:
     t=next(t for t in tests if t['id']==r['id']);c=ctx[r['id'],arm]
     assert r['prompt_sha256']==c['prompt_sha256']
     obj=parse(r['raw']);refmap={s['id']:s for s in c['context']};refs=obj.get('citations') if obj else None
     citations=[]
     if isinstance(refs,list):
       for ref in refs:
         isdict=isinstance(ref,dict);source=refmap.get(ref.get('source_id')) if isdict else None;quote=ref.get('quote') if isdict else None
         valid=source is not None and isinstance(quote,str) and bool(quote.strip()) and norm(quote) in norm(source['text'])
         citations.append({'source_id':ref.get('source_id') if isdict else None,'source_exists':source is not None,'quote_valid':valid,'quote_words':len(quote.split()) if isinstance(quote,str) else None,'url':source['url'] if source else None})
     validjson=obj is not None
     checks.append({'id':r['id'],'arm':arm,'parse_ok':validjson,'status_ok':validjson and obj.get('status')==t['gold']['status'],'data_ok':validjson and equal(obj.get('data'),t['gold']['data']),'answer_nonempty':validjson and isinstance(obj.get('answer'),str) and bool(obj['answer'].strip()),'citations_array_ok':isinstance(refs,list),'citation_checks':citations,'quote_valid':bool(citations) and all(x['quote_valid'] for x in citations),'citation_length_ok':all(x['quote_words'] is not None and 0<x['quote_words']<=12 for x in citations),'truncated':r.get('finish_reason')=='length','generation_tokens':r.get('generation_tokens'),'seconds':r.get('seconds'),'content_correct':None,'citation_supported':None,'fully_grounded':None,'note':'Content and support require agent semantic review, not checked by this script.'})
 retrieval=[]
 for t in tests:
   if t['gold']['status']!='known':continue
   c=ctx[t['id'],'retrieved'];hits=c['retrieval']['hits'];delivered=c['context'];gold=t['gold_evidence'];want={e['doc_id'] for e in gold}
   item={'id':t['id'],'required_docs':sorted(want)}
   for label,items in [('candidate',hits),('delivered',delivered)]:
     found={h['doc_id'] for h in items};item[label+'_doc_recall']=len(found&want)/len(want);item[label+'_all_docs']=want<=found
     item[label+'_all_spans']=all(covered(e['start_char'],e['end_char'],[(int(h['start_char']),int(h['end_char'])) for h in items if h['doc_id']==e['doc_id']]) for e in gold)
   retrieval.append(item)
 summary={'known_questions':len(retrieval),'candidate_macro_doc_recall_at3':sum(r['candidate_doc_recall'] for r in retrieval)/len(retrieval),'candidate_all_required_docs_count':sum(r['candidate_all_docs'] for r in retrieval),'candidate_all_gold_spans_count':sum(r['candidate_all_spans'] for r in retrieval),'delivered_macro_doc_recall':sum(r['delivered_doc_recall'] for r in retrieval)/len(retrieval),'delivered_all_required_docs_count':sum(r['delivered_all_docs'] for r in retrieval),'delivered_all_gold_spans_count':sum(r['delivered_all_spans'] for r in retrieval)}
 result={'raw_sha256':rawhash,'completed_rows':counts,'all_180_complete':all(n==60 for n in counts.values()),'items':checks,'retrieval':{'summary':summary,'items':retrieval},'semantic_review_complete':False,'human_validation':False}
 (ROOT/'runs/mechanical-checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'completed':counts,'mechanical_only':True,'retrieval':summary},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
