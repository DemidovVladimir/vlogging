"""Scoped 4B model comparison with export and cleanup even after failure."""
from pathlib import Path
import datetime,hashlib,json,os,shutil,signal,subprocess,traceback
A=Path(__file__).resolve().parents[1];BASE=A.parent.parent;OLD=A.parent/'defi-v5';SMALL=A.parent/'defi-v6/selection'
RUN=BASE/'lumen-local-defi-v7';PY='/opt/homebrew/bin/python3.12'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def host():
 return {'at_utc':now(),'pressure':int(subprocess.check_output(['sysctl','-n','kern.memorystatus_vm_pressure_level'],text=True)),
 'swap':subprocess.check_output(['sysctl','vm.swapusage'],text=True).strip(),'memory_pressure':subprocess.check_output(['memory_pressure','-Q'],text=True).strip(),
 'physical_ram_bytes':int(subprocess.check_output(['sysctl','-n','hw.memsize'],text=True)),
 'cpu':subprocess.check_output(['sysctl','-n','machdep.cpu.brand_string','hw.ncpu'],text=True).strip(),'free_disk_bytes':shutil.disk_usage(A).free}
def stage(name,cmd,online=False):
 print(json.dumps({'stage':name,'at_utc':now()}),flush=True)
 command=[PY,'-B',str(RUN/'manage.py'),'exec','--stage',name]+(['--online'] if online else [])+['--',*cmd]
 ret=subprocess.run(command,cwd=RUN)
 if ret.returncode:raise RuntimeError(f'{name} returned{ret.returncode}; stop without automatic model reruns')
def main():
 assert not RUN.exists() and not (A/'execution').exists()
 initial=host();save(A/'resources/initial.json',initial)
 assert initial['pressure']==1 and initial['free_disk_bytes']>=12*2**30
 baseline={'v5':{f:sha(OLD/f) for f in ['exam/test.jsonl','exam/grading-rubric.json','sources/documents.json']},
 'small':{f:sha(SMALL/f) for f in ['inputs/contexts.jsonl','inputs/prompts.jsonl','runs/selection.jsonl','runs/presented.jsonl','runs/grades.json','tools/attach_citations.py','execution/prepare_selection.py']}}
 save(A/'baseline-freeze.json',baseline)
 RUN.mkdir();(RUN/'inputs').mkdir();(RUN/'provenance').mkdir()
 for name in ['manage.py','resource_guard.py','requirements.in','requirements.lock.txt']:shutil.copy2(SMALL/'execution'/name,RUN/name)
 for p in (A/'tools').glob('*.py'):shutil.copy2(p,RUN/p.name)
 for name in ['retrieval_v5.py','retrieval_v6.py']:shutil.copy2(SMALL/'execution'/name,RUN/name)
 shutil.copy2(SMALL/'execution/prepare_selection.py',RUN/'formatting_baseline.py')
 shutil.copy2(SMALL/'execution/provenance/original-chat-template.jinja',RUN/'provenance/baseline-original-chat-template.jinja')
 shutil.copy2(SMALL/'inputs/contexts.jsonl',RUN/'inputs/baseline-contexts.jsonl')
 shutil.copy2(SMALL/'inputs/prompts.jsonl',RUN/'inputs/baseline-prompts.jsonl')
 shutil.copy2(A/'model-choice.json',RUN/'config.json')
 (RUN/'source-handbook.txt').write_text('Frozen evidence catalogue only; no gold answers/training data.\n');(RUN/'train-config.yaml').write_text('training_enabled: false\n')
 subprocess.run([PY,'-B',str(RUN/'manage.py'),'init'],check=True);marker=json.loads((RUN/'.lumen-experiment.json').read_text())
 state={'started_at_utc':now(),'status':'preparing','answers_planned':60,'model_scores_available':False};failure=None
 try:
   stage('venv',[PY,'-m','venv',str(RUN/'.venv')])
   stage('install',['.venv/bin/python','-m','pip','install','--disable-pip-version-check','--no-cache-dir','-r','requirements.lock.txt'],True)
   stage('download',['.venv/bin/python','download_model.py'],True)
   stage('prepare',['.venv/bin/python','prepare_comparison.py'])
   stage('preflight',['.venv/bin/python','defi_harness.py','--preflight'])
   save(RUN/'host-before-model.json',host());assert host()['pressure']==1
   files=[p.name for p in RUN.glob('*.py')]+['model-lock.json','requirements.in','requirements.lock.txt','config.json','preflight.json','inputs/baseline-contexts.jsonl','inputs/baseline-prompts.jsonl','inputs/contexts.jsonl','inputs/prompts.jsonl','inputs/summary.json','.lumen-experiment.json','provenance/original-chat-template.jinja','provenance/baseline-original-chat-template.jinja']
   frozen={'created_at_utc':now(),'files':{f:sha(RUN/f) for f in files},'baseline_files':baseline,'controller_sha256':sha(Path(__file__)),'same60questions_same_messages_same_catalogue':True,'changes_frozen_before_inference':True,'new_model_and_native_chat_template':True,'decoding_and_output_limits_unchanged':True,'allocator_memory_limit_increased_for_weights':True,'benchmark_already_seen':True}
   save(RUN/'freeze.json',frozen);save(A/'input-freeze.json',frozen)
   guard=['.venv/bin/python','resource_guard.py','--max-footprint-gib','4.5','--max-swap-growth-gib','0.25']
   stage('probe',[*guard,'--stage','probe','--','.venv/bin/python','defi_harness.py','--probe'])
   assert json.loads((RUN/'runs/probe.json').read_text())['functional_ok']
   stage('experiment',[*guard,'--stage','experiment','--','.venv/bin/python','defi_harness.py'])
   output=[json.loads(s) for s in (RUN/'runs/larger.jsonl').read_text().splitlines() if s.strip()]
   assert sum('id' in r for r in output)==60
   assert all(sha(OLD/f)==h for f,h in baseline['v5'].items()) and all(sha(SMALL/f)==h for f,h in baseline['small'].items())
   state.update(status='completed',answers_completed=60,grading_pending=True)
 except BaseException as e:
   failure=e;state.update(status='stopped',error=f'{type(e).__name__}: {e}',traceback=traceback.format_exc())
 finally:
   dest=A/'execution';dest.mkdir(exist_ok=False)
   for p in RUN.iterdir():
     if p.is_file() and p.suffix in ['.py','.json','.yaml','.txt','.in']:shutil.copy2(p,dest/p.name)
   for name in ['inputs','provenance','.control','runs']:
     if (RUN/name).exists():shutil.copytree(RUN/name,dest/name)
   if (dest/'freeze.json').exists():
     f=json.loads((dest/'freeze.json').read_text());assert all(sha(dest/n)==h for n,h in f['files'].items())
   for name in ['inputs','runs']:
     if (RUN/name).exists():shutil.copytree(RUN/name,A/name,dirs_exist_ok=True)
   kb=lambda:subprocess.run(['lsof','-nP','-iTCP:7341','-sTCP:LISTEN'],capture_output=True,text=True).stdout
   kb_before=kb();free_before=shutil.disk_usage(RUN).free;logical=sum(p.lstat().st_size for p in RUN.rglob('*') if p.is_file())
   clean=subprocess.run([PY,'-B',str(RUN/'manage.py'),'cleanup','--apply','--expect-id',marker['id']],capture_output=True,text=True)
   (A/'cleanup-command.log').write_text(clean.stdout+clean.stderr)
   assert clean.returncode==0 and not RUN.exists(),'Cleanup failed; inspect before completion'
   ps=subprocess.check_output(['ps','-axo','pid=,comm=,args='],text=True)
   owned=[s for s in ps.splitlines() if len(s.split(None,2))==3 and 'python' in Path(s.split(None,2)[1]).name.lower() and str(RUN)+'/' in s.split(None,2)[2]]
   assert not owned,owned
   save(A/'cleanup.json',{'completed_at_utc':now(),'runtime':str(RUN),'runtime_removed':True,'owned_jobs_remaining':0,'inference_or_training_running':False,'server_started':False,'logical_bytes_removed':logical,'observed_free_disk_delta_bytes':shutil.disk_usage(A).free-free_before,'weights_venv_and_caches_removed':True,'ks_kb_listener_unchanged':kb_before==kb(),'other_apps_workloads_and_ollama_untouched':True,'retained':'Code, frozen inputs, raw outputs, measurements and report. Old archives unchanged.','outcome':state['status'],'host_after':host()})
   state.update(finished_at_utc=now(),cleanup_completed=True);save(A/'runs/pipeline-state.json',state);print(json.dumps(state,ensure_ascii=False,indent=2),flush=True)
 if failure:raise SystemExit(1)
if __name__=='__main__':
 signal.signal(signal.SIGTERM,lambda n,f:(_ for _ in ()).throw(KeyboardInterrupt('Stop; export and cleanup')))
 main()
