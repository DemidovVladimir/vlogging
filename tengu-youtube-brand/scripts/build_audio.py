from pathlib import Path
import math
import random
import struct
import wave

RATE = 48_000
DURATION = 3.0
OUT = Path(__file__).resolve().parents[1] / "motion" / "remotion" / "public" / "audio" / "tengu-sting.wav"
random.seed(19)


def envelope(t, start, length, attack=.01, release=.12):
    if t < start or t > start + length:
        return 0.0
    p = t - start
    a = min(1.0, p / max(attack, 1e-4))
    r = min(1.0, (length - p) / max(release, 1e-4))
    return max(0.0, min(a, r))


def sample(t):
    value = 0.0
    for start, freq in [(0.16, 1700), (0.34, 1320), (0.52, 1960), (0.70, 980), (0.88, 1480), (1.06, 1180)]:
        env = envelope(t, start, .085, .002, .07)
        value += .085 * env * (math.sin(2 * math.pi * freq * t) + .22 * random.uniform(-1, 1))
    whoosh = envelope(t, .62, .92, .15, .32)
    value += .055 * whoosh * random.uniform(-1, 1) * (0.55 + .45 * math.sin(math.pi * (t - .62) / .92))
    thump = envelope(t, 1.50, .48, .008, .4)
    value += .30 * thump * math.sin(2 * math.pi * (74 - 20 * max(0, t - 1.5)) * (t - 1.5))
    shimmer = envelope(t, 1.66, .54, .02, .36)
    value += .055 * shimmer * math.sin(2 * math.pi * 610 * t)
    return max(-.92, min(.92, value))


OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as wav:
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(RATE)
    for i in range(int(RATE * DURATION)):
        t = i / RATE
        left = sample(t)
        right = left * .985
        wav.writeframesraw(struct.pack("<hh", int(left * 32767), int(right * 32767)))
print(OUT)
