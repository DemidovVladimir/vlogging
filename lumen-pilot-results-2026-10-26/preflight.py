"""Static compatibility/resource inventory before any model compute."""
import datetime
import json
import platform
import shutil
import subprocess
from common import ROOT, MODEL, require_managed, dump_json, read_jsonl

def value(name):
    return subprocess.check_output(['/usr/sbin/sysctl', '-n', name], text=True).strip()

def main():
    require_managed()
    import mlx.core as mx
    pressure = int(value('kern.memorystatus_vm_pressure_level'))
    free = shutil.disk_usage(ROOT).free
    device = mx.device_info()
    assert platform.machine() == 'arm64' and platform.system() == 'Darwin'
    assert pressure == 1, 'Host already under memory pressure; do not start model compute.'
    assert free >= 12 * 1024**3, 'Insufficient disk reserve.'
    config = json.loads((MODEL / 'config.json').read_text())
    h = config['hidden_size']; inter = config['intermediate_size']
    kv = config['num_key_value_heads'] * config['head_dim']
    rank = 8; layers = 4
    lora_count = layers * rank * (4*h + 2*(h+kv) + 3*(h+inter))
    row = {
        'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'cpu': value('machdep.cpu.brand_string'), 'cpu_cores': int(value('hw.logicalcpu')),
        'unified_memory_bytes': int(value('hw.memsize')), 'python': platform.python_version(),
        'macOS': platform.mac_ver()[0], 'mlx_device_info': device,
        'host_memory_pressure_level': pressure, 'host_swap': value('vm.swapusage'),
        'disk_free_bytes': free, 'weight_file_bytes': (MODEL / 'model.safetensors').stat().st_size,
        'data': json.loads((ROOT / 'data-lock.json').read_text()),
        'technical_budget': {'child_tree_footprint_GiB': 6, 'host_swap_growth_GiB': 0.75,
                             'warning_pressure_level': 2, 'normal_pressure_level': 1},
        'static_estimates_not_measured': {
            'lora_parameter_count': lora_count,
            'fp32_adapter_plus_grad_plus_two_adam_states_bytes': lora_count * 16,
            'single_fp32_logits_tensor_at_512_tokens_bytes': 512 * config['vocab_size'] * 4,
            'note': 'Activations, workspaces, allocator cache, runtime overhead and load transients require measurement.'},
        'static_compatibility_passed': True, 'training_capacity_approved': False,
        'next_gate': 'Separate 20-iteration train-only probe with a 512-token padded batch; no test answers.'
    }
    dump_json(ROOT / 'preflight.json', row)
    print(json.dumps(row, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
