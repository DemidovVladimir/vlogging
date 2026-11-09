"""Same v5 metrics plus paired ablations. Semantic decisions remain explicit."""
from pathlib import Path
import collections,datetime,hashlib,json,statistics,sys
ROOT=Path(__file__).resolve().parents[1];OLD=ROOT.parents[1]/'defi-v5'
sys.path.insert(0,str(OLD/'tools'))
from mechanical_checks import rows,sha,parse,norm,equal,covered
ARMS=['selection']
def save(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def mechanical():
 tests=rows(OLD/'exam/test.jsonl');tm={x['id']:x for x in tests}
 contexts={(r['id'],r['arm']):r for r in rows(ROOT/'inputs/contexts.jsonl')}
 prompts={(r['id'],r['arm']):r for r in rows(ROOT/'inputs/prompts.jsonl')}
 items=[];hashes={};allseq=[];modelmeta=[]
 for arm in ARMS:
   rr=rows(ROOT/'runs/presented.jsonl');hashes[arm]=sha(ROOT/'runs/presented.jsonl')
   modelmeta.append(rr[0]['meta']);out=[r for r in rr if 'id' in r]
   assert len(out)==60 and {r['id'] for r in out}==set(tm)
   for r in out:
     c=contexts[r['id'],arm];p=prompts[r['id'],arm];t=tm[r['id']]
     assert r['prompt_sha256']==p['sha256']==c['prompt_sha256']
     assert hashlib.sha256(p['prompt'].encode()).hexdigest()==p['sha256']
     assert r['prompt_tokens']==p['tokens'];allseq.append(r['sequence'])
     obj=parse(r['raw']);valid=obj is not None;refs=obj.get('citations') if valid else None;refmap={s['id']:s for s in c['context']};checks=[]
     if isinstance(refs,list):
       for ref in refs:
         src=refmap.get(ref.get('source_id')) if isinstance(ref,dict) else None
         q=ref.get('quote') if isinstance(ref,dict) else None
         ok=src is not None and isinstance(q,str) and bool(q.strip()) and norm(q) in norm(src['text'])
         checks.append({'source_id':ref.get('source_id') if isinstance(ref,dict) else None,'quote_valid':ok,'source_exists':src is not None,'quote_words':len(q.split()) if isinstance(q,str) else None,'url':src['url'] if src else None})
     items.append({'id':r['id'],'arm':arm,'parse_ok':valid,'status_ok':valid and obj.get('status')==t['gold']['status'],'data_ok':valid and equal(obj.get('data'),t['gold']['data']),'answer_nonempty':valid and isinstance(obj.get('answer'),str) and bool(obj['answer'].strip()),'citations_array_ok':isinstance(refs,list),'quote_valid':bool(checks) and all(x['quote_valid'] for x in checks),'citation_checks':checks,'citation_length_limit':48,'citation_length_ok':all(x['quote_words'] is not None and 0<x['quote_words']<=48 for x in checks),'truncated':r['finish_reason']=='length','seconds':r['seconds'],'generation_tokens':r['generation_tokens'],'prompt_tokens':r['prompt_tokens'],'parsed':obj})
 assert sorted(allseq)==list(range(1,61))
 stable=[{k:v for k,v in m.items() if k!='arm'} for m in modelmeta];assert all(m==stable[0] for m in stable)
 oldmeta=rows(OLD/'runs/retrieved.jsonl')[0]['meta']
 for key in ['model_fingerprint','model_weight_sha256','settings','versions']:assert stable[0][key]==oldmeta[key],key
 coverage=[]
 for t in tests:
   if t['gold']['status']!='known':continue
   for arm in ARMS:
     c=contexts[t['id'],arm]['context'];want={g['doc_id'] for g in t['gold_evidence']}
     coverage.append({'id':t['id'],'arm':arm,'all_required_docs':want<={s['doc_id'] for s in c},'all_gold_spans':all(covered(g['start_char'],g['end_char'],[(int(s['start_char']),int(s['end_char'])) for s in c if s['doc_id']==g['doc_id']]) for g in t['gold_evidence'])})
 integrity={'status':'PASS','all60_prompt_hashes_and_token_counts_match':True,'all60_unique':True,'same_model_weights_tokenizer_decoding_versions_as_v5':True,'all_finish_reason_stop':not any(x['truncated'] for x in items),'exam_sha256':sha(OLD/'exam/test.jsonl'),'rubric_sha256':sha(OLD/'exam/grading-rubric.json'),'raw_sha256':hashes}
 save(ROOT/'runs/mechanical-checks.json',{'items':items,'raw_sha256':hashes,'coverage':coverage,'integrity':integrity,'primary_parse_policy':'whole JSON only, same v5 parser; no fence removal or repair'})
 save(ROOT/'runs/final-integrity.json',integrity)
 print(json.dumps({arm:{'parse':sum(x['parse_ok'] for x in items if x['arm']==arm),'data_exact':sum(x['data_ok'] for x in items if x['arm']==arm),'known_quote_valid':sum(x['quote_valid'] for x in items if x['arm']==arm and tm[x['id']]['gold']['status']=='known'),'all_required_docs':sum(x['all_required_docs'] for x in coverage if x['arm']==arm),'all_gold_spans':sum(x['all_gold_spans'] for x in coverage if x['arm']==arm)} for arm in ARMS},ensure_ascii=False,indent=2))
def merge():
 tests=rows(OLD/'exam/test.jsonl');tm={t['id']:t for t in tests}
 mm=json.loads((ROOT/'runs/mechanical-checks.json').read_text());review=json.loads((ROOT/'runs/semantic-review.json').read_text())
 assert review['raw_sha256']==mm['raw_sha256'] and review['exam_sha256']==sha(OLD/'exam/test.jsonl')
 sem={(r['id'],r['arm']):r for r in review['items']};assert len(sem)==60
 items=[]
 for m in mm['items']:
   s=sem[m['id'],m['arm']];assert type(s['content_correct']) is bool
   assert type(s['citation_supported']) is bool or s['citation_supported'] is None
   known=tm[m['id']]['gold']['status']=='known'
   items.append({**m,**s,'fully_grounded':(s['content_correct'] and m['quote_valid'] and s['citation_supported'] is True) if known else None})
 summary={}
 for a in ARMS:
   rr=[r for r in items if r['arm']==a];known=[r for r in rr if tm[r['id']]['gold']['status']=='known'];unknown=[r for r in rr if tm[r['id']]['gold']['status']=='unknown'];cov=[r for r in mm['coverage'] if r['arm']==a]
   summary[a]={'content_correct':sum(r['content_correct'] for r in rr),'total':60,'known_content_correct':sum(r['content_correct'] for r in known),'known_total':52,'fully_grounded_known':sum(r['fully_grounded'] for r in known),'unknown_content_correct':sum(r['content_correct'] for r in unknown),'unknown_structured_correct':sum(all(r[k] for k in ['content_correct','parse_ok','status_ok','data_ok']) for r in unknown),'unknown_total':8,'parse_ok':sum(r['parse_ok'] for r in rr),'data_ok':sum(r['data_ok'] for r in rr),'quote_valid_known':sum(r['quote_valid'] for r in known),'citation_supported_known':sum(r['citation_supported'] is True for r in known),'truncated':sum(r['truncated'] for r in rr),'mean_inference_seconds':statistics.mean(r['seconds'] for r in rr),'total_inference_seconds':sum(r['seconds'] for r in rr),'mean_prompt_tokens':statistics.mean(r['prompt_tokens'] for r in rr),'mean_generation_tokens':statistics.mean(r['generation_tokens'] for r in rr),'all_required_docs':sum(r['all_required_docs'] for r in cov),'all_gold_spans':sum(r['all_gold_spans'] for r in cov)}
 old=json.loads((OLD/'runs/grades.json').read_text());oldrows={r['id']:r for r in old['items'] if r['arm']=='retrieved'}
 bykey={(r['id'],r['arm']):r for r in items};paired={}
 def compare(label,before,after):
   wins=[t['id'] for t in tests if not before(t['id'])['content_correct'] and after(t['id'])['content_correct']]
   losses=[t['id'] for t in tests if before(t['id'])['content_correct'] and not after(t['id'])['content_correct']]
   paired[label]={'gained':len(wins),'lost':len(losses),'net':len(wins)-len(losses),'gained_ids':wins,'lost_ids':losses}
 for a in ARMS:compare(a+'_vs_v5',lambda id:oldrows[id],lambda id:bykey[id,a])
 save(ROOT/'runs/grades.json',{'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'human_validation':False,'semantic_review_complete':True,'primary_metric':'Same v5 rubric; agent content review on60 and fully grounded known52 separately. Familiar development exam, not held out.','raw_sha256':mm['raw_sha256'],'exam_sha256':sha(OLD/'exam/test.jsonl'),'rubric_sha256':sha(OLD/'exam/grading-rubric.json'),'review_sha256':sha(ROOT/'runs/semantic-review.json'),'summary':summary,'baseline_summary':old['summary'],'paired_comparisons':paired,'coverage':mm['coverage'],'items':items})
 state=json.loads((ROOT/'runs/pipeline-state.json').read_text());state.update(model_scores_available=True,grading_pending=False);save(ROOT/'runs/pipeline-state.json',state)
 print(json.dumps({'summary':summary,'paired':paired},ensure_ascii=False,indent=2))
if __name__=='__main__':
 if len(sys.argv)>1 and sys.argv[1]=='merge':merge()
 else:mechanical()
