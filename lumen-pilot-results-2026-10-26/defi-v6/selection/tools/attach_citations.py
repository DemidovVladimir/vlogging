"""Presentation layer: copies ONLY model-selected literal catalogue units.

Does not change model status/answer/data, repair JSON, select IDs, or retry.
"""
from pathlib import Path
import hashlib,json,sys
ROOT=Path(__file__).resolve().parents[1];OLD=ROOT.parents[1]/'defi-v5'
sys.path.insert(0,str(OLD/'tools'))
from mechanical_checks import parse,rows,sha
def main():
 freeze=json.loads((ROOT/'adapter-freeze.json').read_text());assert sha(Path(__file__))==freeze['adapter_sha256']
 contexts={r['id']:r for r in rows(ROOT/'inputs/contexts.jsonl')}
 checks=[]
 with (ROOT/'runs/presented.jsonl').open('x') as f:
   for r in rows(ROOT/'runs/selection.jsonl'):
     if 'meta' in r:
       f.write(json.dumps({'meta':{**r['meta'],'presentation':'Only literal citations attached from valid model-selected IDs; status/answer/data unchanged.'}},ensure_ascii=False)+'\n');continue
     obj=parse(r['raw']);refmap={c['id']:c for c in contexts[r['id']]['context']};valid=False;finalraw=r['raw'];ids=None
     if obj is not None:
       ids=obj.get('evidence_ids');valid=isinstance(ids,list) and len(ids)<=3 and all(isinstance(x,str) and x in refmap for x in ids) and len(set(ids))==len(ids)
       cites=[{'source_id':id,'quote':refmap[id]['text']} for id in ids] if valid else []
       presented={'status':obj.get('status'),'answer':obj.get('answer'),'data':obj.get('data'),'citations':cites}
       assert all(presented[key]==obj.get(key) for key in ['status','answer','data'])
       finalraw=json.dumps(presented,ensure_ascii=False,separators=(',',':'))
     out={**r,'raw':finalraw,'model_raw_sha256':hashlib.sha256(r['raw'].encode()).hexdigest(),'citation_attachment_valid':valid}
     f.write(json.dumps(out,ensure_ascii=False)+'\n')
     checks.append({'id':r['id'],'model_json_valid':obj is not None,'evidence_ids':ids,'ids_valid':valid,'status_answer_data_unchanged':True,'output_json_repaired':False,'ids_chosen_by_adapter':False})
 result={'raw_model_file_sha256':sha(ROOT/'runs/selection.jsonl'),'presented_file_sha256':sha(ROOT/'runs/presented.jsonl'),'adapter_sha256':sha(Path(__file__)),'no_answer_status_data_repair':True,'all60':len(checks)==60,'items':checks}
 (ROOT/'runs/attachment-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='items'},indent=2))
if __name__=='__main__':main()
