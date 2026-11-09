#!/usr/bin/env python3
"""Sample/limit only this invocation's child tree; no MLX imports or system changes.

Physical footprint is summed per process (shared mappings can be counted more than
once). This is a conservative one-second sampler, not a kernel allocation cap.
"""
import argparse
import ctypes
import errno
import json
import os
import re
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone

from common import ROOT, require_managed

GIB = 1024 ** 3


class MeasurementError(RuntimeError):
    pass


class RusageV0(ctypes.Structure):
    # Darwin sys/resource.h, RUSAGE_INFO_V0. Times/identity are mach absolute ticks.
    _fields_ = [('ri_uuid', ctypes.c_uint8 * 16)] + [
        (name, ctypes.c_uint64) for name in (
            'ri_user_time', 'ri_system_time', 'ri_pkg_idle_wkups',
            'ri_interrupt_wkups', 'ri_pageins', 'ri_wired_size',
            'ri_resident_size', 'ri_phys_footprint', 'ri_proc_start_abstime',
            'ri_proc_exit_abstime')]


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def command_output(argv):
    try:
        return subprocess.check_output(argv, text=True, stderr=subprocess.PIPE,
                                       timeout=5).strip()
    except (OSError, subprocess.SubprocessError) as exc:
        raise MeasurementError(f'Cannot read {argv!r}: {exc}') from exc


def host_resources():
    raw = command_output(['/usr/sbin/sysctl', '-n', 'vm.swapusage'])
    found = re.search(r'\bused\s*=\s*([0-9.]+)([BKMGTP]?)\b', raw)
    if not found:
        raise MeasurementError('Cannot parse vm.swapusage: ' + raw)
    swap = int(float(found[1]) * 1024 ** 'BKMGTP'.index(found[2] or 'B'))
    text = command_output(['/usr/sbin/sysctl', '-n', 'kern.memorystatus_vm_pressure_level'])
    try:
        pressure = int(text)
    except ValueError as exc:
        raise MeasurementError('Invalid memory pressure level: ' + text) from exc
    if pressure < 0:
        raise MeasurementError('Invalid negative memory pressure level')
    return swap, pressure


class ProcessTree:
    def __init__(self, child):
        if sys.platform != 'darwin':
            raise MeasurementError('resource_guard requires Darwin libproc')
        self.child = child
        self.lib = ctypes.CDLL('/usr/lib/libproc.dylib', use_errno=True)
        self.lib.proc_pid_rusage.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_void_p]
        self.lib.proc_pid_rusage.restype = ctypes.c_int
        self.identities = {}  # PID -> ri_proc_start_abstime, including observed descendants.
        self.reused_pids = set()

    def usage(self, pid):
        record = RusageV0()
        ctypes.set_errno(0)
        result = self.lib.proc_pid_rusage(pid, 0, ctypes.byref(record))
        if result != 0:
            number = ctypes.get_errno()
            if number in (errno.ESRCH, errno.ENOENT):
                return None
            raise MeasurementError(f'proc_pid_rusage({pid}) failed: errno={number} {os.strerror(number)}')
        if not record.ri_proc_start_abstime:
            raise MeasurementError(f'PID {pid} has no usable process identity')
        return record

    @staticmethod
    def table():
        result = {}
        for line in command_output(['/bin/ps', '-axo', 'pid=,ppid=,stat=']).splitlines():
            values = line.split()
            if len(values) != 3:
                raise MeasurementError('Cannot parse process table row: ' + line)
            try:
                result[int(values[0])] = (int(values[1]), values[2])
            except ValueError as exc:
                raise MeasurementError('Invalid process table row: ' + line) from exc
        return result

    def sample(self):
        table = self.table()
        live = {}
        # Retain known descendants even if their parent has already exited.
        for pid, expected in list(self.identities.items()):
            row = table.get(pid)
            if row is None or row[1].startswith('Z'):
                continue
            usage = self.usage(pid)
            if usage is None or usage.ri_proc_exit_abstime:
                continue  # Exited between ps and libproc.
            if usage.ri_proc_start_abstime != expected:
                self.reused_pids.add(pid)
                continue  # This PID now belongs to someone else; never signal it.
            live[pid] = usage

        # Initial child must still be our direct child, not a recycled PID.
        pid = self.child.pid
        if pid not in self.identities and self.child.poll() is None:
            row = table.get(pid)
            if row is None or row[0] != os.getpid() or row[1].startswith('Z'):
                if self.child.poll() is None:
                    raise MeasurementError('Cannot verify identity of live direct child')
            else:
                usage = self.usage(pid)
                if usage is not None and not usage.ri_proc_exit_abstime:
                    self.identities[pid] = usage.ri_proc_start_abstime
                    live[pid] = usage

        # Discover new descendants using verified parents and start identities.
        progress = True
        while progress:
            progress = False
            for pid, (parent_pid, state) in table.items():
                if pid in live or pid in self.reused_pids or state.startswith('Z'):
                    continue
                if parent_pid not in live:
                    continue
                parent = self.usage(parent_pid)
                if parent is None or parent.ri_proc_start_abstime != live[parent_pid].ri_proc_start_abstime:
                    continue
                usage = self.usage(pid)
                if usage is None or usage.ri_proc_exit_abstime:
                    continue
                if usage.ri_proc_start_abstime < parent.ri_proc_start_abstime:
                    raise MeasurementError(f'Invalid descendant identity for PID {pid}')
                expected = self.identities.get(pid)
                if expected is not None and expected != usage.ri_proc_start_abstime:
                    raise MeasurementError(f'PID {pid} reused inside child tree; identity ambiguous')
                self.identities[pid] = usage.ri_proc_start_abstime
                live[pid] = usage
                progress = True

        if self.child.poll() is None and self.child.pid not in live:
            raise MeasurementError('Live child has no resource measurement; refusing an unmeasured run')
        processes = []
        for pid, usage in sorted(live.items()):
            if usage.ri_phys_footprint == 0 or usage.ri_resident_size == 0:
                # A process can finish between ps and libproc; a zombie has no
                # resident pages and must not be confused with an unreadable live task.
                current = self.table().get(pid)
                if current is None or current[1].startswith('Z'):
                    continue
                raise MeasurementError(f'PID {pid} returned zero footprint/RSS; cannot enforce budget')
            processes.append({
                'pid': pid, 'start_abstime': usage.ri_proc_start_abstime,
                'footprint_bytes': usage.ri_phys_footprint,
                'rss_bytes': usage.ri_resident_size,
            })
        return processes

    def signal_verified(self, sig):
        """Each signal is preceded by fresh kernel identity verification."""
        sent = []
        for pid, expected in reversed(list(self.identities.items())):
            usage = self.usage(pid)
            if usage is None or usage.ri_proc_exit_abstime:
                continue
            if usage.ri_proc_start_abstime != expected:
                self.reused_pids.add(pid)
                continue
            if pid == os.getpid():
                raise MeasurementError('Refusing to signal the guard itself')
            try:
                os.kill(pid, sig)
                sent.append(pid)
            except ProcessLookupError:
                pass
        return sent

    def stop(self):
        errors = []
        own_child_term = False
        try:
            self.sample()  # Last opportunity to discover children before terminating parent.
        except MeasurementError as exc:
            errors.append(str(exc))
        # Even if libproc itself fails, our unreaped direct Popen child is ours:
        # its PID cannot be recycled before it is reaped. Never do this for any
        # descendant, whose identity must always be checked through libproc.
        if self.child.poll() is None:
            try:
                self.child.terminate()
                own_child_term = True
            except ProcessLookupError:
                pass
        try:
            term = self.signal_verified(signal.SIGTERM)
        except MeasurementError as exc:
            errors.append(str(exc))
            term = []
        deadline = time.monotonic() + 4
        while time.monotonic() < deadline:
            self.child.poll()  # Reap own child, so zombies are not treated as active.
            table = self.table()
            active = [pid for pid, expected in self.identities.items()
                      if pid in table and not table[pid][1].startswith('Z')
                      and (current := self.usage(pid)) is not None
                      and current.ri_proc_start_abstime == expected]
            if not active:
                break
            time.sleep(0.1)
        try:
            killed = self.signal_verified(signal.SIGKILL)
        except MeasurementError as exc:
            errors.append(str(exc))
            killed = []
        try:
            self.child.wait(timeout=3)
        except subprocess.TimeoutExpired:
            self.child.kill()  # Still our unreaped direct child.
            self.child.wait(timeout=3)
        deadline = time.monotonic() + 2
        survivors = []
        while True:
            table = self.table()
            survivors = [pid for pid, expected in self.identities.items()
                         if pid in table and not table[pid][1].startswith('Z')
                         and (current := self.usage(pid)) is not None
                         and current.ri_proc_start_abstime == expected]
            if not survivors or time.monotonic() >= deadline:
                break
            time.sleep(0.1)
        if survivors:
            errors.append('Verified descendants remain alive after SIGKILL: ' + repr(survivors))
        return {'term_pids': term, 'own_direct_child_terminated': own_child_term,
                'kill_pids': killed, 'surviving_verified_pids': survivors, 'errors': errors}


def main():
    require_managed()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stage', required=True)
    parser.add_argument('--max-footprint-gib', type=float, default=6)
    parser.add_argument('--max-swap-growth-gib', type=float, default=0.75)
    parser.add_argument('--interval', type=float, default=1)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.command and args.command[0] == '--':
        args.command.pop(0)
    if not args.command or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,79}', args.stage):
        parser.error('Supply a safe stage name and -- COMMAND')
    if not (0 < args.max_footprint_gib <= 1024 and 0 <= args.max_swap_growth_gib <= 1024
            and 0.1 <= args.interval <= 10):
        parser.error('Invalid limits or sample interval (allowed 0.1–10 s)')
    directory = ROOT / 'runs' / 'resources'
    directory.mkdir(parents=True, exist_ok=True)
    samples_path = directory / (args.stage + '.samples.jsonl')
    summary_path = directory / (args.stage + '.json')
    # Reserve both names exclusively before launching anything; no silent overwrite.
    try:
        summary_fd = summary_path.open('x')
    except FileExistsError:
        parser.error('Result already exists: ' + str(summary_path))
    try:
        samples_fd = samples_path.open('x')
    except FileExistsError:
        summary_fd.close()
        summary_path.unlink()  # Only our empty reservation, never an existing report.
        parser.error('Samples already exist: ' + str(samples_path))
    started = time.monotonic()
    summary = {
        'schema': 1, 'stage': args.stage, 'started_at': utc_now(), 'command': args.command,
        'limits': {'footprint_bytes': int(args.max_footprint_gib * GIB),
                   'swap_growth_bytes': int(args.max_swap_growth_gib * GIB),
                   'pressure_level': 2, 'consecutive_host_limit_samples': 3,
                   'sample_interval_seconds': args.interval},
        'measurement': 'sum libproc rusage_info_v0 physical footprint and RSS of verified child tree',
        'samples': 0, 'peak_footprint_bytes': None, 'peak_rss_bytes': None,
        'max_swap_growth_bytes': None, 'observed_pressure_levels': [],
        'guard_exit_code': 125, 'child_exit_code': None, 'status': 'initializing',
    }
    child = tree = None
    received_signal = [None]
    old_handlers = {}
    for sig in (signal.SIGINT, signal.SIGTERM):
        old_handlers[sig] = signal.signal(sig, lambda number, frame: received_signal.__setitem__(0, number))
    try:
        initial_swap, initial_pressure = host_resources()
        summary['initial_swap_bytes'] = initial_swap
        summary['observed_pressure_levels'] = [initial_pressure]
        if sys.platform != 'darwin':
            raise MeasurementError('Darwin is required')
        # Do not begin a workload while the machine already reports pressure.
        if initial_pressure >= 2:
            raise MeasurementError(f'Preflight pressure level {initial_pressure} >= 2; child not started')
        child = subprocess.Popen(args.command, shell=False)  # Same process group; inherited stdio/env.
        summary['child_pid'] = child.pid
        tree = ProcessTree(child)
        pressure_streak = swap_streak = 0
        while True:
            tick = time.monotonic()
            if received_signal[0] is not None:
                summary.update(status='interrupted', reason=f'Received signal {received_signal[0]}',
                               guard_exit_code=128 + received_signal[0])
                break
            processes = tree.sample()
            swap, pressure = host_resources()
            delta = swap - initial_swap
            pressure_streak = pressure_streak + 1 if pressure >= 2 else 0
            swap_streak = swap_streak + 1 if delta > summary['limits']['swap_growth_bytes'] else 0
            footprint = sum(item['footprint_bytes'] for item in processes) if processes else None
            rss = sum(item['rss_bytes'] for item in processes) if processes else None
            if processes:
                summary['samples'] += 1
                summary['peak_footprint_bytes'] = max(summary['peak_footprint_bytes'] or 0, footprint)
                summary['peak_rss_bytes'] = max(summary['peak_rss_bytes'] or 0, rss)
            summary['max_swap_growth_bytes'] = max(summary['max_swap_growth_bytes'] or 0, delta)
            summary['observed_pressure_levels'] = sorted(set(summary['observed_pressure_levels'] + [pressure]))
            sample = {'at': utc_now(), 'wall_seconds': time.monotonic() - started,
                      'footprint_bytes': footprint, 'rss_bytes': rss,
                      'swap_bytes': swap, 'swap_growth_bytes': delta,
                      'pressure_level': pressure, 'pressure_streak': pressure_streak,
                      'swap_streak': swap_streak, 'processes': processes}
            samples_fd.write(json.dumps(sample) + '\n')
            samples_fd.flush()
            reason = None
            if footprint is not None and footprint > summary['limits']['footprint_bytes']:
                reason = f'Child-tree physical footprint {footprint / GIB:.3f} GiB exceeds {args.max_footprint_gib:.3f} GiB'
            elif pressure_streak >= 3:
                reason = f'Host memory pressure >= 2 for {pressure_streak} consecutive samples'
            elif swap_streak >= 3:
                reason = f'Host swap growth > {args.max_swap_growth_gib:.3f} GiB for {swap_streak} consecutive samples'
            if reason:
                summary.update(status='protective_stop', reason=reason, guard_exit_code=124)
                break
            exit_code = child.poll()
            if exit_code is not None:
                if summary['samples'] == 0:
                    raise MeasurementError('Child exited before any valid footprint/RSS sample; resource use is unmeasured')
                summary.update(status='completed' if exit_code == 0 else 'child_failed',
                               child_exit_code=exit_code, guard_exit_code=exit_code if exit_code >= 0 else 128 - exit_code)
                if processes:
                    summary['reason'] = 'Direct child exited; stopping any verified surviving descendants'
                break
            # Sleep in short pieces so signals are serviced promptly.
            deadline = tick + args.interval
            while time.monotonic() < deadline and received_signal[0] is None:
                time.sleep(min(0.1, max(0, deadline - time.monotonic())))
    except (MeasurementError, OSError, ValueError, subprocess.SubprocessError) as exc:
        summary.update(status='measurement_error', reason=str(exc), guard_exit_code=125)
    finally:
        if tree is not None:
            try:
                summary['termination'] = tree.stop()
                if summary['termination']['errors']:
                    summary['guard_exit_code'] = summary['guard_exit_code'] or 125
                    if summary['status'] == 'completed':
                        summary.update(status='termination_error', reason='; '.join(summary['termination']['errors']))
            except Exception as exc:
                summary['termination'] = {'errors': [str(exc)]}
                summary['guard_exit_code'] = summary['guard_exit_code'] or 125
        elif child is not None:
            # Own unreaped direct child cannot have its PID reused; no foreign PID.
            if child.poll() is None:
                child.terminate()
                try:
                    child.wait(timeout=4)
                except subprocess.TimeoutExpired:
                    child.kill()
                    child.wait(timeout=3)
        if child is not None:
            summary['child_exit_code'] = child.poll()
        summary['finished_at'] = utc_now()
        summary['wall_seconds'] = time.monotonic() - started
        summary['observed_process_identities'] = tree.identities if tree else {}
        summary['reused_pids_ignored'] = sorted(tree.reused_pids) if tree else []
        samples_fd.close()
        json.dump(summary, summary_fd, indent=2)
        summary_fd.write('\n')
        summary_fd.close()
        for sig, handler in old_handlers.items():
            signal.signal(sig, handler)
        print(f"RESOURCE GUARD {args.stage}: {summary['status']}; "
              f"exit={summary['guard_exit_code']}; {summary.get('reason', 'child finished')}", flush=True)
        print('Resource summary: ' + str(summary_path), flush=True)
    return summary['guard_exit_code']


if __name__ == '__main__':
    sys.exit(main())
