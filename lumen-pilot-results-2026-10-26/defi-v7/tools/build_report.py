"""Self-contained offline comparison: same evidence, larger checkpoint."""
from pathlib import Path
import datetime,hashlib,json,os
ROOT=Path(__file__).resolve().parents[1];OLD=ROOT.parent/'defi-v5';SMALL=ROOT.parent/'defi-v6/selection'
def read(p):return json.loads(p.read_text())
def rows(p):return [json.loads(x) for x in p.read_text().splitlines() if x.strip()]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def learning_summary():
 """Historical scores remain separate from the later DeFi exam."""
 parent=ROOT.parent
 v2=read(parent/'v2/runs/report-data.json');v3=read(parent/'v3/runs/report-data.json')
 arms=[]
 for key in ['base','v1','clean200','expanded200','expanded800']:
  a=v2['arms'][key];review=v2['semantic_review']['arms'][key]
  actual=sum(r['full_answer_correct'] for r in v2['semantic_by_arm'][key].values())
  assert actual==review['full_answer_correct'] and review['count']==60
  arms.append({'key':key,'label':a['label'],'examples':a['train_n'],'steps':a['steps'],'correct':actual,'total':60})
 context=sum(r['semantic'] for r in v3['arms']['context']['rows'].values())
 assert context==30 and arms[0]['correct']==5 and arms[1]['correct']==16
 assert v3['arms']['base']['file_sha256']==v2['arms']['base']['sha256']
 assert v3['arms']['lora']['file_sha256']==v2['arms']['v1']['sha256']
 recall=v2['recall_semantic']
 return {'exam':'Lumen fictional cinema, 60 questions; different from DeFi','model':'Qwen3-1.7B-4bit','arms':arms,'context_correct':context,'human_validation':False,'training_recall':{'correct':recall['full_correct'],'total':recall['count'],'held_out':recall['held_out']},'sources':{n:sha(parent/n) for n in ['v2/runs/report-data.json','v3/runs/report-data.json','v2/runs/training-recall-semantic.json']}}
def main():
 gg=read(ROOT/'runs/grades.json');bg=read(SMALL/'runs/grades.json');clean=read(ROOT/'cleanup.json')
 assert len(gg['items'])==60 and gg['semantic_review_complete'] and clean['runtime_removed'] and not Path(clean['runtime']).exists()
 cc={r['id']:r for r in rows(ROOT/'inputs/contexts.jsonl')};bc={r['id']:r for r in rows(SMALL/'inputs/contexts.jsonl')}
 grades={'small':{r['id']:r for r in bg['items']},'larger':{r['id']:r for r in gg['items']}}
 raw={};presented={}
 for label,where,file in [('small',SMALL,'selection.jsonl'),('larger',ROOT,'larger.jsonl')]:
   raw[label]={r['id']:r for r in rows(where/'runs'/file) if 'id' in r}
   presented[label]={r['id']:r for r in rows(where/'runs/presented.jsonl') if 'id' in r}
 items=[]
 for t in rows(OLD/'exam/test.jsonl'):
   assert cc[t['id']]['context']==bc[t['id']]['context']
   refs=[]
   for c in cc[t['id']]['context']:
     file=(OLD/c['file']).resolve();assert file.read_text()[int(c['start_char']):int(c['end_char'])]==c['text']
     refs.append({**c,'local_href':os.path.relpath(file,ROOT)})
   items.append({'id':t['id'],'protocol':t.get('related_protocol',t['protocol']),'question':t['question'],'fields':t['fields'],'gold':t['gold'],'context':refs,'modes':{a:{'raw':raw[a][t['id']],'presented':presented[a][t['id']],'grade':grades[a][t['id']]} for a in raw}})
 category={}
 for prefix in ['aave','kamino','eth','unknown']:
   rr=[q for q in items if q['id'].startswith(prefix+'-')]
   category[prefix]={'total':len(rr),**{a:{'content':sum(q['modes'][a]['grade']['content_correct'] for q in rr),'grounded':sum(q['modes'][a]['grade']['fully_grounded'] is True for q in rr)} for a in raw}}
 data={'generated_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'small':bg['summary']['selection'],'larger':gg['summary']['larger'],'paired':gg['paired_comparisons']['larger_vs_small'],'categories':category,'questions':items,'resource':read(ROOT/'runs/resources/experiment.json'),'probe':read(ROOT/'runs/resources/probe.json'),'initial':read(ROOT/'resources/initial.json'),'preflight':read(ROOT/'execution/preflight.json'),'cleanup':clean,'choice':read(ROOT/'model-choice.json'),'design':read(ROOT/'design.json'),'input_summary':read(ROOT/'inputs/summary.json'),'attachment':read(ROOT/'runs/attachment-audit.json'),'integrity':read(ROOT/'final-audit.json'),'small_resources':read(SMALL/'runs/resources/experiment.json')}
 data['unknown_status_counts']={a:sum(q['modes'][a]['grade']['status_ok'] for q in items if q['gold']['status']=='unknown') for a in ['small','larger']}
 data['learning_summary']=learning_summary()
 (ROOT/'report-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
 html=(ROOT/'tools/report-template.html.in').read_text().replace('/*INLINE_CSS*/',(ROOT/'tools/report.css').read_text()).replace('REPORT_DATA_JSON',payload).replace('/*INLINE_JS*/',(ROOT/'tools/report.js').read_text())
 hist=data['learning_summary']
 replacements={'BASE_SCORE':hist['arms'][0]['correct'],'LORA_SCORE':hist['arms'][1]['correct'],'CONTEXT_SCORE':hist['context_correct'],'CLEAN_SCORE':hist['arms'][2]['correct'],'EXPANDED_SCORE':hist['arms'][3]['correct'],'LONG_SCORE':hist['arms'][4]['correct'],'RECALL_SCORE':hist['training_recall']['correct']}
 for name,value in replacements.items():html=html.replace('{{'+name+'}}',str(value))
 (ROOT/'report.html').write_text(html)
 print(json.dumps({'report':str(ROOT/'report.html'),'bytes':len(html.encode()),'questions':60,'new_model_answers':60,'historical_answers':60,'same_evidence_all60':True,'cleanup_verified':True},ensure_ascii=False))
if __name__=='__main__':main()
