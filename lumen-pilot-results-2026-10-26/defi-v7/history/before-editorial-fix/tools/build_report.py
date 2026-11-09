"""Self-contained offline comparison: same evidence, larger checkpoint."""
from pathlib import Path
import datetime,hashlib,json,os
ROOT=Path(__file__).resolve().parents[1];OLD=ROOT.parent/'defi-v5';SMALL=ROOT.parent/'defi-v6/selection'
def read(p):return json.loads(p.read_text())
def rows(p):return [json.loads(x) for x in p.read_text().splitlines() if x.strip()]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
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
 (ROOT/'report-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
 html=(ROOT/'tools/report-template.html').read_text().replace('/*INLINE_CSS*/',(ROOT/'tools/report.css').read_text()).replace('REPORT_DATA_JSON',payload).replace('/*INLINE_JS*/',(ROOT/'tools/report.js').read_text())
 (ROOT/'report.html').write_text(html)
 print(json.dumps({'report':str(ROOT/'report.html'),'bytes':len(html.encode()),'questions':60,'new_model_answers':60,'historical_answers':60,'same_evidence_all60':True,'cleanup_verified':True},ensure_ascii=False))
if __name__=='__main__':main()
