"""Join independent semantic reviews with frozen mechanical checks, no inference."""
from pathlib import Path
import collections,datetime,hashlib,json,statistics
from mechanical_checks import rows,sha
ROOT=Path(__file__).resolve().parents[1]
ARMS=['closed','oracle','retrieved']
def main():
 tests=rows(ROOT/'exam/test.jsonl');testmap={r['id']:r for r in tests}
 checks=json.loads((ROOT/'runs/mechanical-checks.json').read_text());assert checks['all_180_complete']
 expected={(t['id'],a) for t in tests for a in ARMS}
 reviews={};provenance=[]
 for name in ['semantic-aave.json','semantic-kamino.json','semantic-ethereum-unknown.json']:
   p=ROOT/'runs'/name;data=json.loads(p.read_text())
   assert data['raw_sha256']==checks['raw_sha256'],name
   assert data['exam_sha256']==sha(ROOT/'exam/test.jsonl'),name
   assert data['contexts_sha256']==sha(ROOT/'inputs/contexts.jsonl'),name
   for r in data['items']:
     key=(r['id'],r['arm']);assert key not in reviews,key
     assert type(r['content_correct']) is bool
     assert type(r['citation_supported']) is bool or r['citation_supported'] is None
     reviews[key]=r
   provenance.append({'file':str(p.relative_to(ROOT)),'sha256':sha(p),'reviewer':data.get('reviewer'),'human_validation':False})
 assert set(reviews)==expected,(len(reviews),expected-set(reviews))
 merged=[]
 for r in checks['items']:
   s=reviews[r['id'],r['arm']];known=testmap[r['id']]['gold']['status']=='known'
   row={**r,**s};row['fully_grounded']=(row['content_correct'] and row['quote_valid'] and row['citation_supported'] is True) if known else None
   merged.append(row)
 summary={}
 for arm in ARMS:
   rr=[r for r in merged if r['arm']==arm];known=[r for r in rr if testmap[r['id']]['gold']['status']=='known'];unknown=[r for r in rr if testmap[r['id']]['gold']['status']=='unknown']
   raw=[r for r in rows(ROOT/'runs'/f'{arm}.jsonl') if 'id' in r]
   summary[arm]={'content_correct':sum(r['content_correct'] for r in rr),'total':60,'known_content_correct':sum(r['content_correct'] for r in known),'known_total':52,'fully_grounded_known':sum(r['fully_grounded'] for r in known),'unknown_content_correct':sum(r['content_correct'] for r in unknown),'unknown_structured_correct':sum(all(r[k] for k in ['parse_ok','status_ok','data_ok','content_correct']) for r in unknown),'unknown_total':8,'parse_ok':sum(r['parse_ok'] for r in rr),'status_ok':sum(r['status_ok'] for r in rr),'data_ok':sum(r['data_ok'] for r in rr),'basic_structured_content_correct':sum(all(r[k] for k in ['parse_ok','status_ok','data_ok','answer_nonempty','citations_array_ok','content_correct']) for r in rr),'quote_valid_known':sum(r['quote_valid'] for r in known),'citation_supported_known':sum(r['citation_supported'] is True for r in known),'truncated':sum(r['truncated'] for r in rr),'mean_inference_seconds':statistics.mean(r['seconds'] for r in raw),'median_inference_seconds':statistics.median(r['seconds'] for r in raw),'total_inference_seconds':sum(r['seconds'] for r in raw),'mean_prompt_tokens':statistics.mean(r['prompt_tokens'] for r in raw),'mean_generation_tokens':statistics.mean(r['generation_tokens'] for r in raw)}
 bykey={(r['id'],r['arm']):r for r in merged}
 pairs={}
 for arm in ['oracle','retrieved']:
   wins=[t['id'] for t in tests if not bykey[t['id'],'closed']['content_correct'] and bykey[t['id'],arm]['content_correct']]
   losses=[t['id'] for t in tests if bykey[t['id'],'closed']['content_correct'] and not bykey[t['id'],arm]['content_correct']]
   pairs[arm+'_vs_closed']={'gained':len(wins),'lost':len(losses),'net':len(wins)-len(losses),'gained_ids':wins,'lost_ids':losses}
 coverage=checks['retrieval']['items'];strata={}
 for value in [True,False]:
   ids={r['id'] for r in coverage if r['delivered_all_spans']==value}
   strata['all_gold_spans_delivered' if value else 'gold_span_missing']={'questions':len(ids),'retrieved_content_correct':sum(bykey[id,'retrieved']['content_correct'] for id in ids),'oracle_content_correct':sum(bykey[id,'oracle']['content_correct'] for id in ids),'ids':sorted(ids)}
 data={'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'human_validation':False,'semantic_review_complete':True,'raw_sha256':checks['raw_sha256'],'exam_sha256':sha(ROOT/'exam/test.jsonl'),'contexts_sha256':sha(ROOT/'inputs/contexts.jsonl'),'rubric_sha256':sha(ROOT/'exam/grading-rubric.json'),'reviews':provenance,'primary_metric':'Substantive correctness on60, distinct from JSON/status/citations; known grounded52 and unknown8 separately. New exam, not directly comparable to historical cinema30/60.','summary':summary,'paired_comparisons':pairs,'retrieved_context_strata':strata,'items':merged}
 (ROOT/'runs/grades.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 state=json.loads((ROOT/'runs/pipeline-state.json').read_text());state.update(model_scores_available=True,grading_pending=False,semantic_review_complete=True)
 (ROOT/'runs/pipeline-state.json').write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'summary':summary,'paired':pairs,'context_strata':{k:{x:y for x,y in v.items() if x!='ids'} for k,v in strata.items()}},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
