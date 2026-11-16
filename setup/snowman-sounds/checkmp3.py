# The MP3s as a browser will decode them: do they keep their length and loudness, and do the loops still join?
#   python3 -I checkmp3.py <folder with report.json and the wavs> <folder of mp3s decoded to raw floats: name.f32 (as many channels as the file has)>
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from dsp import *
from scipy.io import wavfile
O, D = sys.argv[1], sys.argv[2]; rep = json.load(open(os.path.join(O, 'report.json'))); worst = 0
print(f"{'sound':<14}{'wav s':>7}{'mp3 s':>7}{'wav loud':>9}{'mp3 loud':>9}{'mp3 peak':>9}")
for n, r in rep.items():
    sr, w = wavfile.read(os.path.join(O, n + '.wav')); w = w.astype(float); w = w[:, None] if w.ndim == 1 else w
    m = np.fromfile(os.path.join(D, n + '.f32'), dtype=np.float32).astype(float).reshape(-1, 2 if r['stereo'] else 1)
    meas = loud_mean if n == 'night-loop' else loud; d = meas(m) - meas(w); worst = max(worst, abs(d)); r['mp3'] = round(float(meas(m)), 1)
    print(f"{n:<14}{len(w) / SR:>7.3f}{len(m) / SR:>7.3f}{meas(w):>9.1f}{meas(m):>9.1f}{peak_db(m):>9.1f}")
print('largest change in loudness from encoding:', round(worst, 2), 'dB')
json.dump(rep, open(os.path.join(O, 'report.json'), 'w'), indent=1)
# The join: where the loop goes round, the sound jumps from what would have come next to what does. How big is that jump beside
# the sound's own sample-to-sample movement? (Tried at 2,000 places where a decoder might put the start.)
for n in ('night-loop', 'campfire-loop'):
    m = np.fromfile(os.path.join(D, n + '.f32'), dtype=np.float32).astype(float); N = int(round(rep[n]['period'] * SR)); step = np.abs(np.diff(m)); typ = np.sqrt((step ** 2).mean())
    ls = np.arange(int(.05 * SR), int(.25 * SR), 4); jump = np.abs(m[ls] - m[ls + N])
    lo = signal.sosfiltfilt(signal.butter(2, 1500, 'lowpass', fs=SR, output='sos'), m); jl = np.abs(lo[ls] - lo[ls + N]); tl = np.sqrt((np.diff(lo) ** 2).mean())
    print(f"{n}: the jump at the join is {np.median(jump) / typ:.2f} of a usual step between samples (median), {np.percentile(jump, 99) / typ:.2f} at worst (99th percentile). Below 1.5 kHz: {np.median(jl) / tl:.2f}, {np.percentile(jl, 99) / tl:.2f}. The largest steps in the sound itself: {np.percentile(step, 99.9) / typ:.1f}")
