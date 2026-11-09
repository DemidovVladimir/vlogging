"""Offline comparison report. Requires complete raw, semantic review and cleanup."""
from pathlib import Path
import datetime,hashlib,html,json,os
ROOT=Path(__file__).resolve().parents[1];OLD=ROOT.parent/'defi-v5'
def read(p):return json.loads(p.read_text())
def rows(p):return [json.loads(s) for s in p.read_text().splitlines() if s.strip()]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 grades=read(ROOT/'runs/grades.json');cleanup=read(ROOT/'cleanup.json');state=read(ROOT/'runs/pipeline-state.json')
 assert grades['semantic_review_complete'] and len(grades['items'])==180 and state['status']=='completed' and cleanup['runtime_removed']
 assert not Path(cleanup['runtime']).exists()
 baseline=read(ROOT/'baseline-freeze.json')
 assert all(sha(OLD/n)==h for n,h in baseline['files'].items())
 follow=ROOT/'selection';fg=read(follow/'runs/grades.json');fc=read(follow/'cleanup.json')
 assert len(fg['items'])==60 and fg['semantic_review_complete'] and fc['runtime_removed'] and not Path(fc['runtime']).exists()
 raw={};contexts={};checks={};model_raw={r['id']:r for r in rows(follow/'runs/selection.jsonl') if 'id' in r}
 for exp,arms in [(OLD,['closed','oracle','retrieved']),(ROOT,['search_only','prompt_only','combined']),(follow,['selection'])]:
   for a in arms:
     raw[a]={r['id']:r for r in rows(exp/'runs'/('presented.jsonl' if a=='selection' else f'{a}.jsonl')) if 'id' in r}
   for c in rows(exp/'inputs/contexts.jsonl'):
     for ref in c['context']:
       file=(OLD/ref['file']).resolve();assert file.exists()
       ref['local_href']=os.path.relpath(file,ROOT)
     contexts[c['id'],c['arm']]=c
   gg=read(exp/'runs/grades.json')
   for x in gg['items']:checks[x['id'],x['arm']]=x
 tests=rows(OLD/'exam/test.jsonl');questions=[]
 for t in tests:
   out={'id':t['id'],'protocol':t.get('related_protocol',t['protocol']),'question':t['question'],'fields':t['fields'],'gold':t['gold'],'evidence':t['gold_evidence'],'modes':{}}
   for a in raw:
     out['modes'][a]={'raw':raw[a][t['id']],'grade':checks[t['id'],a],'context':contexts[t['id'],a]['context']}
     if a=='selection':out['modes'][a]['model_raw']=model_raw[t['id']]['raw']
   questions.append(out)
 data={'generated_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'summary':grades['summary'],'baseline_summary':grades['baseline_summary'],'paired':grades['paired_comparisons'],'questions':questions,'cleanup':cleanup,'resources':read(ROOT/'runs/resources/experiment.json'),'probe':read(ROOT/'runs/resources/probe.json'),'initial':read(ROOT/'resources/initial.json'),'preflight':read(ROOT/'execution/preflight.json'),'design':read(ROOT/'design.json'),'integrity':read(ROOT/'runs/final-integrity.json'),'input_summary':read(ROOT/'inputs/summary.json')}
 data['summary'].update(fg['summary']);data['paired'].update(fg['paired_comparisons'])
 data['followup']={'grades':{k:v for k,v in fg.items() if k!='items'},'cleanup':fc,'resources':read(follow/'runs/resources/experiment.json'),'probe':read(follow/'runs/resources/probe.json'),'preflight':read(follow/'execution/preflight.json'),'attachment':read(follow/'runs/attachment-audit.json'),'design':read(follow/'design.json')}
 (ROOT/'report-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
 template=(ROOT/'tools/report-template.html').read_text()
 template=template.replace('/*INLINE_CSS*/',(ROOT/'tools/report.css').read_text()).replace('/*INLINE_JS*/',(ROOT/'tools/report.js').read_text()).replace('REPORT_DATA_JSON',payload)
 (ROOT/'report.html').write_text(template)
 print(json.dumps({'report':str(ROOT/'report.html'),'bytes':len(template.encode()),'questions':len(questions),'raw_answers':sum(len(v) for v in raw.values()),'main_new_answers':240,'cleanup_verified':True},ensure_ascii=False))
if __name__=='__main__':main()
