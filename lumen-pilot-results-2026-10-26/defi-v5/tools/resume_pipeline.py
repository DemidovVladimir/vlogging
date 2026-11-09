"""Resume the frozen local experiment and always export evidence + clean runtime.

No exam/query/prompt changes. No model server. Lifecycle is scoped by marker ID.
"""
from pathlib import Path
import datetime,hashlib,json,os,shutil,signal,subprocess,sys,traceback
ARCHIVE=Path(__file__).resolve().parents[1]
BASE=ARCHIVE.parent.parent
RUN=BASE/'lumen-local-defi-v5'
PY='/opt/homebrew/bin/python3.12'
HISTORY=ARCHIVE/'history/before-resume'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def save(p,data):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def backup(rel):
 p=ARCHIVE/rel;dest=HISTORY/rel
 if p.exists() and not dest.exists():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
def stage(name,command):
 print(json.dumps({'phase':name,'at_utc':now()}),flush=True)
 result=subprocess.run([PY,'-B',str(RUN/'manage.py'),'exec','--stage',name,'--',*command],cwd=BASE)
 if result.returncode:raise RuntimeError(f'{name} returned {result.returncode}; preserve evidence, do not rerun automatically')
def count(arm):
 p=RUN/'runs'/f'{arm}.jsonl'
 return sum('id' in json.loads(line) for line in p.read_text().splitlines() if line.strip()) if p.exists() else 0
def main():
 marker=json.loads((RUN/'.lumen-experiment.json').read_text())
 assert marker['root']==str(RUN) and marker['uid']==os.getuid()
 state={'started_at_utc':now(),'status':'running','planned_answers':180,'valid_main_answers':0,'invalid_kv4_answers_excluded':28,'model_scores_available':False,'authorization':'User explicitly approved graceful Brave quit and continuing the same frozen experiment.'}
 failure=None
 try:
   source_freeze=json.loads((ARCHIVE/'input-freeze.json').read_text())
   assert all(sha(ARCHIVE/name)==want for name,want in source_freeze['files'].items())
   assert sha(RUN/'inputs/prompts.jsonl')==sha(ARCHIVE/'inputs/prompts.jsonl')
   assert sha(RUN/'defi_harness.py')==sha(ARCHIVE/'tools/defi_harness.py')
   assert json.loads((ARCHIVE/'resources/resume-after-authorized-quit.json').read_text())['all_three_normal']
   stage('preflight-resumed',['.venv/bin/python','defi_harness.py','--preflight'])
   files=['common.py','manage.py','resource_guard.py','download_model.py','defi_harness.py','model-lock.json','protocol.json','preflight.json','requirements.in','requirements.lock.txt','constraints.txt','inputs/prompts.jsonl','inputs/contexts.jsonl','inputs/summary.json','provenance/original-chat-template.jinja','runs/functional-sanity.json','.lumen-experiment.json']
   frozen={'created_at_utc':now(),'files':{name:sha(RUN/name) for name in files},'scope':'Resumed after user-authorized Brave quit. Ordinary KV. Same180prompts,60questions,sourcecontext,query/weights/decoding as frozen primary design.'}
   save(RUN/'freeze.json',frozen)
   resume_freeze={'created_at_utc':now(),'original_input_freeze_sha256':sha(ARCHIVE/'input-freeze.json'),'runtime_freeze_sha256':sha(RUN/'freeze.json'),'original_archive_inputs':source_freeze['files'],'controller_sha256':sha(Path(__file__)),'marker_id':marker['id'],'questions_and_contexts_changed':False}
   save(ARCHIVE/'primary-run-freeze.json',resume_freeze)
   shutil.copy2(RUN/'preflight.json',ARCHIVE/'resources/resume-preflight.json')
   stage('probe-resumed',['.venv/bin/python','resource_guard.py','--stage','probe','--max-footprint-gib','3.5','--max-swap-growth-gib','0.25','--','.venv/bin/python','defi_harness.py','--probe'])
   probe=json.loads((RUN/'runs/resources/probe.json').read_text())
   assert probe['status']=='completed' and probe['guard_exit_code']==0
   assert json.loads((RUN/'runs/probe.json').read_text())['functional_ok']
   stage('experiment-resumed',['.venv/bin/python','resource_guard.py','--stage','experiment','--max-footprint-gib','3.5','--max-swap-growth-gib','0.25','--','.venv/bin/python','defi_harness.py'])
   counts={a:count(a) for a in ['closed','oracle','retrieved']};assert all(v==60 for v in counts.values()),counts
   state.update(status='completed',valid_main_answers=180,completed_per_arm=counts,grading_pending=True)
 except BaseException as exc:
   failure=exc;state.update(status='stopped',error=f'{type(exc).__name__}: {exc}',traceback=traceback.format_exc(),completed_per_arm={a:count(a) for a in ['closed','oracle','retrieved']})
   state['valid_main_answers']=sum(state['completed_per_arm'].values())
 finally:
   # Every generation subprocess has exited (or manage.py has stopped its tree)
   # before export/cleanup. Never delete source archives or unrelated caches.
   destination=ARCHIVE/'execution-resumed';destination.mkdir(exist_ok=False)
   for p in RUN.iterdir():
     if p.is_file() and p.suffix in ['.py','.json','.yaml','.txt','.in']:shutil.copy2(p,destination/p.name)
   for name in ['inputs','provenance','.control','runs']:
     if (RUN/name).exists():shutil.copytree(RUN/name,destination/name)
   if (destination/'freeze.json').exists():
     f=json.loads((destination/'freeze.json').read_text());assert all(sha(destination/name)==want for name,want in f['files'].items())
   for p in (RUN/'runs').glob('*'):
     if p.is_file():backup('runs/'+p.name);shutil.copy2(p,ARCHIVE/'runs'/p.name)
   for p in (RUN/'runs/resources').glob('*'):
     if p.is_file():shutil.copy2(p,ARCHIVE/'resources'/('resume-'+p.name))
   logical=sum(p.lstat().st_size for p in RUN.rglob('*') if p.is_file());free_before=shutil.disk_usage(BASE).free
   kb_before=subprocess.run(['lsof','-nP','-iTCP:7341','-sTCP:LISTEN'],capture_output=True,text=True).stdout
   cleanup=subprocess.run([PY,'-B',str(RUN/'manage.py'),'cleanup','--apply','--expect-id',marker['id']],cwd=BASE,capture_output=True,text=True)
   backup('cleanup-command.log');(ARCHIVE/'cleanup-command.log').write_text(cleanup.stdout+cleanup.stderr)
   if cleanup.returncode or RUN.exists():raise RuntimeError('Cleanup failed; inspect log and finish cleanup before reporting completion')
   free_after=shutil.disk_usage(BASE).free
   kb_after=subprocess.run(['lsof','-nP','-iTCP:7341','-sTCP:LISTEN'],capture_output=True,text=True).stdout
   ps=subprocess.check_output(['ps','-axo','pid=,comm=,args='],text=True)
   owned=[]
   for line in ps.splitlines():
     fields=line.strip().split(None,2)
     if len(fields)==3 and 'python' in Path(fields[1]).name.lower() and str(RUN)+'/' in fields[2]:owned.append(line)
   assert not owned,owned
   receipt={'completed_at_utc':now(),'runtime':str(RUN),'runtime_removed':True,'owned_jobs_remaining':0,'inference_or_training_running':False,'no_report_server_started':True,'logical_bytes_removed_estimate':logical,'observed_free_disk_delta_bytes':free_after-free_before,'ks_kb_preserved':bool(kb_before.strip()) and kb_before==kb_after,'docker_and_other_workloads_untouched':True,'apps_gracefully_closed_for_resources':['Brave','Spotify','Slack'],'model_weights_environments_caches_removed':True,'retained':'Frozen public documents/index, questions, contexts, raw model answers, code and measurement evidence. No model runtime.','valid_main_answers':state['valid_main_answers'],'invalid_kv4_answers_excluded':28,'pipeline_outcome':state['status'],'host_pressure_after':int(subprocess.check_output(['sysctl','-n','kern.memorystatus_vm_pressure_level'],text=True)),'host_swap_after':subprocess.check_output(['sysctl','vm.swapusage'],text=True).strip()}
   backup('cleanup.json');save(ARCHIVE/'cleanup.json',receipt)
   state['finished_at_utc']=now();state['cleanup_completed']=True;backup('runs/pipeline-state.json');save(ARCHIVE/'runs/pipeline-state.json',state)
   save(ARCHIVE/'execution-resumed-export.json',{'exported_at_utc':now(),'runtime_id':marker['id'],'valid_main_answers':state['valid_main_answers'],'status':state['status'],'weights_exported':False,'venv_exported':False,'caches_exported':False,'cleanup_completed':True})
   print(json.dumps({'pipeline':state,'cleanup':receipt},ensure_ascii=False,indent=2),flush=True)
 if failure:raise SystemExit(1)
if __name__=='__main__':
 def interrupted(number,frame):raise KeyboardInterrupt(f'Signal {number}; export and cleanup owned work')
 signal.signal(signal.SIGTERM,interrupted)
 main()
