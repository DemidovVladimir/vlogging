"""Disposable local v6 run. Export evidence and cleanup on success or failure."""
from pathlib import Path
import datetime,hashlib,json,os,shutil,signal,subprocess,sys,traceback
ARCHIVE=Path(__file__).resolve().parents[1]
OLD=ARCHIVE.parents[1]/'defi-v5'
RUN=ARCHIVE.parents[2]/'lumen-local-defi-v6-selection'
PY='/opt/homebrew/bin/python3.12'
ARMS=['selection']
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def host():
 return {'at_utc':now(),'pressure':int(subprocess.check_output(['sysctl','-n','kern.memorystatus_vm_pressure_level'],text=True)),
 'swap':subprocess.check_output(['sysctl','vm.swapusage'],text=True).strip(),'free_disk_bytes':shutil.disk_usage(ARCHIVE).free,
 'physical_ram_bytes':int(subprocess.check_output(['sysctl','-n','hw.memsize'],text=True)),
 'hardware':subprocess.check_output(['sysctl','-n','hw.model','hw.ncpu'],text=True).strip(),
 'memory_pressure':subprocess.check_output(['memory_pressure','-Q'],text=True).strip()}
def stage(name,cmd,online=False):
 print(json.dumps({'stage':name,'at_utc':now()}),flush=True)
 command=[PY,'-B',str(RUN/'manage.py'),'exec','--stage',name]
 if online:command+=['--online']
 command+=['--',*cmd]
 ret=subprocess.run(command,cwd=RUN)
 if ret.returncode:raise RuntimeError(f'{name} failed with {ret.returncode}; no automatic re-generation')
def count(arm):
 p=RUN/'runs'/f'{arm}.jsonl'
 return sum('id' in json.loads(x) for x in p.read_text().splitlines() if x.strip()) if p.exists() else 0
def main():
 assert not RUN.exists(),'Refuse to reuse an uninspected runtime'
 assert not (ARCHIVE/'execution').exists(),'An execution archive already exists'
 initial=host();save(ARCHIVE/'resources/initial.json',initial)
 assert initial['pressure']==1 and initial['free_disk_bytes']>12*2**30
 state={'started_at_utc':now(),'status':'preparing','answers_planned':60,'model_scores_available':False}
 baseline_files=['exam/test.jsonl','exam/grading-rubric.json','runs/grades.json','inputs/contexts.jsonl','inputs/prompts.jsonl','sources/documents.json','sources/search.sqlite','execution-resumed/model-lock.json']
 baseline={f:sha(OLD/f) for f in baseline_files};save(ARCHIVE/'baseline-freeze.json',{'files':baseline,'root':str(OLD)})
 RUN.mkdir();(RUN/'inputs').mkdir()
 for name in ['common.py','manage.py','resource_guard.py','download_model.py','requirements.in','requirements.lock.txt']:
   shutil.copy2(OLD/'execution-resumed'/name,RUN/name)
 for p in (ARCHIVE/'tools').glob('*.py'):shutil.copy2(p,RUN/p.name)
 (RUN/'source-handbook.txt').write_text('v6 retrieval/prompt experiment. No training corpus or gold answers available to inference.\n')
 (RUN/'train-config.yaml').write_text('training_enabled: false\n')
 save(RUN/'config.json',{'source_root':str(OLD),'model_expected_lock_sha256':baseline['execution-resumed/model-lock.json']})
 tests=[json.loads(x) for x in (OLD/'exam/test.jsonl').read_text().splitlines() if x.strip()]
 with (RUN/'inputs/visible-questions.jsonl').open('x') as f:
   for t in tests:f.write(json.dumps({'id':t['id'],'question':t['question'],'fields':t['fields'],'protocol':t.get('related_protocol',t['protocol'])},ensure_ascii=False)+'\n')
 with (RUN/'inputs/baseline-retrieved-contexts.jsonl').open('x') as f:
   for line in (OLD/'inputs/contexts.jsonl').read_text().splitlines():
     r=json.loads(line)
     if r['arm']=='retrieved':f.write(json.dumps(r,ensure_ascii=False)+'\n')
 subprocess.run([PY,'-B',str(RUN/'manage.py'),'init'],check=True)
 marker=json.loads((RUN/'.lumen-experiment.json').read_text())
 failure=None
 try:
   stage('venv',[PY,'-m','venv',str(RUN/'.venv')])
   stage('install',['.venv/bin/python','-m','pip','install','--disable-pip-version-check','--no-cache-dir','-r','requirements.lock.txt'],True)
   stage('download',['.venv/bin/python','download_model.py'],True)
   assert sha(RUN/'model-lock.json')==baseline['execution-resumed/model-lock.json'],'Checkpoint/tokenizer differs from baseline'
   stage('prepare',['.venv/bin/python','prepare_selection.py'])
   stage('preflight',['.venv/bin/python','defi_harness.py','--preflight'])
   after=host();save(RUN/'host-before-model.json',after);assert after['pressure']==1
   names=[p.name for p in RUN.glob('*.py')]+['model-lock.json','requirements.in','requirements.lock.txt','config.json','preflight.json','inputs/visible-questions.jsonl','inputs/baseline-retrieved-contexts.jsonl','inputs/prompts.jsonl','inputs/contexts.jsonl','inputs/summary.json','.lumen-experiment.json','provenance/original-chat-template.jinja']
   frozen={'created_at_utc':now(),'files':{f:sha(RUN/f) for f in names},'baseline_files':baseline,'controller_sha256':sha(Path(__file__)),'changes_frozen_before_valid_inference':True,'development_benchmark_already_seen':True,'no_gold_read_by_retrieval_or_formatter':True,'same_model_same_decoding_same_1400_input_384_output_budget':True}
   save(RUN/'freeze.json',frozen)
   save(ARCHIVE/'input-freeze.json',frozen)
   guard=['.venv/bin/python','resource_guard.py','--max-footprint-gib','3.5','--max-swap-growth-gib','0.25']
   stage('probe',[*guard,'--stage','probe','--','.venv/bin/python','defi_harness.py','--probe'])
   probe=json.loads((RUN/'runs/probe.json').read_text());assert probe['functional_ok']
   stage('experiment',[*guard,'--stage','experiment','--','.venv/bin/python','defi_harness.py'])
   counts={arm:count(arm) for arm in ARMS};assert all(v==60 for v in counts.values()),counts
   for f,h in baseline.items():assert sha(OLD/f)==h,f
   state.update(status='completed',answers_completed=60,counts=counts,grading_pending=True)
 except BaseException as exc:
   failure=exc;state.update(status='stopped',error=f'{type(exc).__name__}: {exc}',traceback=traceback.format_exc(),counts={a:count(a) for a in ARMS})
 finally:
   dest=ARCHIVE/'execution';dest.mkdir(exist_ok=False)
   for p in RUN.iterdir():
     if p.is_file() and p.suffix in ['.py','.json','.yaml','.txt','.in']:shutil.copy2(p,dest/p.name)
   for name in ['inputs','provenance','.control','runs']:
     if (RUN/name).exists():shutil.copytree(RUN/name,dest/name)
   if (dest/'freeze.json').exists():
     ff=json.loads((dest/'freeze.json').read_text());assert all(sha(dest/n)==h for n,h in ff['files'].items())
   for name in ['inputs','runs']:
     if (RUN/name).exists():shutil.copytree(RUN/name,ARCHIVE/name,dirs_exist_ok=True)
   kb=lambda:subprocess.run(['lsof','-nP','-iTCP:7341','-sTCP:LISTEN'],capture_output=True,text=True).stdout
   before_kb=kb();before_free=shutil.disk_usage(RUN).free
   logical=sum(p.lstat().st_size for p in RUN.rglob('*') if p.is_file())
   clean=subprocess.run([PY,'-B',str(RUN/'manage.py'),'cleanup','--apply','--expect-id',marker['id']],capture_output=True,text=True)
   (ARCHIVE/'cleanup-command.log').write_text(clean.stdout+clean.stderr)
   assert clean.returncode==0 and not RUN.exists(),'Cleanup failed; inspect and complete before final report'
   after_free=shutil.disk_usage(ARCHIVE).free
   ps=subprocess.check_output(['ps','-axo','pid=,comm=,args='],text=True)
   owned=[s for s in ps.splitlines() if str(RUN)+'/' in s and 'python' in s.split(None,2)[1].lower()]
   assert not owned,owned
   save(ARCHIVE/'cleanup.json',{'completed_at_utc':now(),'runtime':str(RUN),'runtime_removed':True,'owned_jobs_remaining':0,'inference_or_training_running':False,'server_started':False,'logical_bytes_removed':logical,'observed_free_disk_delta_bytes':after_free-before_free,'weights_venv_and_caches_removed':True,'new_temporary_search_index_removed':True,'ks_kb_listener_unchanged':before_kb==kb(),'other_apps_and_workloads_untouched':True,'retained':'Code, frozen prompts and sources references, raw answers and resource measurements only; existing v5 archive unchanged.','outcome':state['status'],'host_after':host()})
   state.update(finished_at_utc=now(),cleanup_completed=True);save(ARCHIVE/'runs/pipeline-state.json',state)
   print(json.dumps(state,ensure_ascii=False,indent=2),flush=True)
 if failure:raise SystemExit(1)
if __name__=='__main__':
 signal.signal(signal.SIGTERM,lambda n,f:(_ for _ in ()).throw(KeyboardInterrupt('Stopped; export and cleanup')))
 main()
