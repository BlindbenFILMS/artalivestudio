# A small toolbox for preparing the game's sounds (numpy + scipy). Everything works on float arrays at 44.1 kHz:
# one column per channel (n, 1) or (n, 2).
import numpy as np
from scipy import signal

SR = 44100


def load(path):
    """A stereo recording decoded by ffmpeg to raw 32-bit floats (two channels, 44.1 kHz)."""
    return np.fromfile(path, dtype=np.float32).astype(np.float64).reshape(-1, 2)


def mono(x):
    return x.mean(1, keepdims=True)


def cut(x, a, b):
    return x[int(round(a * SR)):int(round(b * SR))].copy()


def _ramp(n):
    return .5 - .5 * np.cos(np.pi * np.arange(n) / max(1, n))   # 0 … 1, smooth at both ends


def fade_in(x, secs):
    n = min(len(x), int(secs * SR)); y = x.copy()
    if n > 0: y[:n] *= _ramp(n)[:, None]
    return y


def fade_out(x, secs):
    n = min(len(x), int(secs * SR)); y = x.copy()
    if n > 0: y[-n:] *= _ramp(n)[::-1][:, None]
    return y


def gain_curve(x, pts):
    """Multiply by a gain that moves smoothly through pts = [(seconds, dB), …] (held before the first and after the last)."""
    t = np.arange(len(x)) / SR; ts = [p[0] for p in pts]; ds = [p[1] for p in pts]; g = np.empty(len(x))
    g[:] = np.interp(t, ts, ds)
    # smooth the corners with a short moving average (10 ms)
    k = int(.01 * SR); g = np.convolve(np.pad(g, (k, k), mode='edge'), np.ones(2 * k + 1) / (2 * k + 1), 'valid')
    return x * (10 ** (g / 20))[:, None]


def decay(x, t0, tau, floor_db=-90):
    """From t0 seconds on, die away as exp(-(t - t0) / tau)."""
    t = np.arange(len(x)) / SR; g = np.where(t < t0, 1.0, np.exp(-(np.maximum(t, t0) - t0) / tau)); g = np.maximum(g, 10 ** (floor_db / 20))
    return x * g[:, None]


def strike(x, a, tau1, tau2, attack=.003):
    """The shape of something struck: a quick rise, then a(…)·fast + (1 − a)·slow dying away."""
    t = np.arange(len(x)) / SR; g = a * np.exp(-t / tau1) + (1 - a) * np.exp(-t / tau2); n = int(attack * SR); g[:n] *= _ramp(n)
    return x * g[:, None]


def _sos(kind, f, order=2):
    return signal.butter(order, f, kind, fs=SR, output='sos')


def hp(x, f, order=2):
    return signal.sosfilt(_sos('highpass', f, order), x, axis=0)


def lp(x, f, order=2):
    return signal.sosfilt(_sos('lowpass', f, order), x, axis=0)


def shelf(x, f, db, kind='high', q=.707):
    """A shelving filter (the Audio EQ Cookbook's): everything above (or below) f is raised or lowered by db."""
    A = 10 ** (db / 40); w = 2 * np.pi * f / SR; cs, sn = np.cos(w), np.sin(w); al = sn / (2 * q); s = 2 * np.sqrt(A) * al
    if kind == 'high':
        b = [A * ((A + 1) + (A - 1) * cs + s), -2 * A * ((A - 1) + (A + 1) * cs), A * ((A + 1) + (A - 1) * cs - s)]
        a = [(A + 1) - (A - 1) * cs + s, 2 * ((A - 1) - (A + 1) * cs), (A + 1) - (A - 1) * cs - s]
    else:
        b = [A * ((A + 1) - (A - 1) * cs + s), 2 * A * ((A - 1) - (A + 1) * cs), A * ((A + 1) - (A - 1) * cs - s)]
        a = [(A + 1) + (A - 1) * cs + s, -2 * ((A - 1) + (A + 1) * cs), (A + 1) + (A - 1) * cs - s]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=0)


def bell(x, f, db, q=1.0):
    """A peaking filter (the Audio EQ Cookbook's): the range round f is raised or lowered by db; q sets how narrow."""
    A = 10 ** (db / 40); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q); b = [1 + al * A, -2 * np.cos(w), 1 - al * A]; a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=0)


def resample(x, rate):
    """Play it `rate` times as fast (so higher by the same factor), by resampling: no time-stretching tricks."""
    from fractions import Fraction
    fr = Fraction(1 / rate).limit_denominator(2000)
    return signal.resample_poly(x, fr.numerator, fr.denominator, axis=0)


def xfade(a, b, secs):
    """a, then b, overlapping by secs with an equal-power cross-fade (for noise-like sound)."""
    n = int(secs * SR); r = _ramp(n)[:, None]; fo, fi = np.sqrt(1 - r), np.sqrt(r)
    return np.concatenate([a[:-n], a[-n:] * fo + b[:n] * fi, b[n:]])


def make_loop(x, period, fade):
    """A stretch that repeats without a join: `period` seconds long. Its first `fade` seconds are blended with what follows the
    end, so the end runs straight into the beginning."""
    P, F = int(round(period * SR)), int(round(fade * SR)); assert len(x) >= P + F, (len(x) / SR, period + fade)
    r = _ramp(F)[:, None]; L = x[:P].copy(); L[:F] = x[:F] * np.sqrt(r) + x[P:P + F] * np.sqrt(1 - r)
    return L


def pad_loop(L, pad):
    """The loop written out with `pad` seconds of itself before and after, so that any window one period long, anywhere in the
    file, joins up (whatever a decoder adds or drops at the very start)."""
    n = int(round(pad * SR)); return np.concatenate([L[-n:], L, L[:n]])


# How loud it will seem on a phone: the ear's weighting of loudness (ITU-R BS.1770's two filters, re-made for 44.1 kHz) and a
# phone speaker's lack of bass (nothing much below 300 Hz).
def weigh(x):
    y = shelf(x, 1681.97, 4.0, 'high', q=.7072)
    y = signal.sosfilt(signal.butter(2, 38.1, 'highpass', fs=SR, output='sos'), y, axis=0)
    return signal.sosfilt(signal.butter(2, 300, 'highpass', fs=SR, output='sos'), y, axis=0)


def loud(x, win=.1):
    """Phone loudness of its loudest tenth of a second, dB below full scale."""
    y = weigh(x); p = (y ** 2).mean(1); n = max(1, int(win * SR))
    if len(p) <= n: return 10 * np.log10(p.mean() + 1e-20)
    c = np.cumsum(np.concatenate([[0], p])); m = (c[n:] - c[:-n]).max() / n
    return 10 * np.log10(m + 1e-20)


def loud_mean(x):
    y = weigh(x); return 10 * np.log10((y ** 2).mean() + 1e-20)


def peak_db(x):
    return 20 * np.log10(np.abs(x).max() + 1e-20)


def normalise(x, target, ceiling=-1.5, measure=loud):
    """Bring its phone loudness to `target` dB, unless its highest peak would pass `ceiling` dB: then as loud as the ceiling allows."""
    g = target - measure(x); g = min(g, ceiling - peak_db(x)); return x * 10 ** (g / 20)


def write_wav(path, x):
    from scipy.io import wavfile
    wavfile.write(path, SR, x.astype(np.float32))
