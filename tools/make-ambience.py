#!/usr/bin/env python3
"""Build the hero's looping ambience bed out of the clip's own room tone.

The hero plays ~6s then freezes on its last frame for 2.5s before restarting.
Across that join the clip's audio stops dead, so the seam is audible the moment
anyone taps for sound. A quiet bed running underneath covers the join and gives
the page a constant pulse.

No credits: the material is the quietest stretch of the clip's own audio.

    python3 tools/make-ambience.py
"""
import os, math, wave, array, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_MP4 = os.path.join(ROOT, 'source-media', 'hero-01-raw.mp4')
TMP_WAV = os.path.join(ROOT, 'source-media', '_roomtone.wav')
OUT_WAV = os.path.join(ROOT, 'source-media', '_ambience.wav')
OUT_M4A = os.path.join(ROOT, 'public', 'media', 'ambience.m4a')

TARGET_SECONDS = 32
TARGET_RMS_DBFS = -26.0     # a bed, not a layer; the player also rides it at 0.35
LOWPASS_HZ = 5200           # air handling, not tape hiss


def run(*cmd):
    subprocess.run(cmd, check=True, capture_output=True)


def read_wav(path):
    with wave.open(path, 'rb') as w:
        assert w.getsampwidth() == 2, 'expected 16-bit'
        rate, n = w.getframerate(), w.getnframes()
        data = array.array('h'); data.frombytes(w.readframes(n))
        if w.getnchannels() == 2:
            data = array.array('h', [(data[i] + data[i + 1]) // 2 for i in range(0, len(data), 2)])
    return rate, data


def rms(seq):
    if not len(seq): return 0.0
    return math.sqrt(sum(float(s) * s for s in seq) / len(seq))


def main():
    if not os.path.exists(SRC_MP4):
        sys.exit(f'missing {SRC_MP4}')
    run('ffmpeg', '-v', 'error', '-i', SRC_MP4, '-vn', '-ac', '1', '-ar', '48000',
        '-c:a', 'pcm_s16le', TMP_WAV, '-y')
    rate, samples = read_wav(TMP_WAV)

    # Quietest contiguous window = the room tone, with the fizz and the settle
    # of the dissolve excluded.
    win = int(rate * 1.5)
    step = int(rate * 0.05)
    best, best_rms = 0, None
    for start in range(0, max(1, len(samples) - win), step):
        r = rms(samples[start:start + win])
        if best_rms is None or r < best_rms:
            best_rms, best = r, start
    print(f'quietest 1.5s window at {best / rate:.2f}s (rms {20 * math.log10(max(best_rms, 1) / 32768):.1f} dBFS)')

    seg = samples[best:best + win]

    # forward + reversed: the block ends on the sample it began with, so it
    # loops seamlessly by construction — no crossfade, no click.
    block = array.array('h', list(seg) + list(reversed(seg)))

    reps = max(1, round(TARGET_SECONDS / (len(block) / rate)))
    bed = array.array('h')
    for _ in range(reps):
        bed.extend(block)

    # Normalise to the target bed level.
    cur = rms(bed)
    if cur > 0:
        gain = (10 ** (TARGET_RMS_DBFS / 20) * 32768) / cur
        peak = max(abs(min(bed)), abs(max(bed))) or 1
        gain = min(gain, 32000 / peak)          # never clip
        bed = array.array('h', [int(max(-32768, min(32767, s * gain))) for s in bed])
        print(f'gain applied: {20 * math.log10(gain):+.1f} dB')

    with wave.open(OUT_WAV, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes(bed.tobytes())

    os.makedirs(os.path.dirname(OUT_M4A), exist_ok=True)
    run('ffmpeg', '-v', 'error', '-i', OUT_WAV,
        '-af', f'lowpass=f={LOWPASS_HZ},afade=t=in:d=0.02',
        '-c:a', 'aac', '-b:a', '48k', '-ac', '1', '-movflags', '+faststart', OUT_M4A, '-y')

    for f in (TMP_WAV, OUT_WAV):
        if os.path.exists(f): os.remove(f)
    print(f'{OUT_M4A}  {len(bed) / rate:.1f}s  {os.path.getsize(OUT_M4A) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
