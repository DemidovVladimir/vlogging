"""Small environment check, without downloading or loading language-model weights."""
import importlib.metadata as md
import json
import platform
import shutil
from common import require_managed

def main():
    require_managed()
    if platform.system() != 'Darwin' or platform.machine() != 'arm64':
        raise SystemExit('This recipe requires native ARM64 Python on Apple Silicon macOS.')
    import mlx.core as mx
    mx.set_default_device(mx.gpu)
    value = mx.array([1.0, 2.0]) * 2
    mx.eval(value)
    print(json.dumps({'python': platform.python_version(), 'arch': platform.machine(),
          'device': str(mx.default_device()), 'small_gpu_operation': value.tolist(),
          'disk_free_GB': round(shutil.disk_usage('.').free / 1e9, 1),
          'versions': {p: md.version(p) for p in ['mlx', 'mlx-lm', 'transformers', 'huggingface_hub']}},
          ensure_ascii=False, indent=2))
    print('Environment probe passed. This does not measure Qwen training memory.')

if __name__ == '__main__':
    main()
