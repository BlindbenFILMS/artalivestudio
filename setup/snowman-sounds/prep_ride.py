# The snowmobile's sounds from Runway (18 November 2026), made ready for the game.
#   python3 -I prep_ride.py <folder of the stereo recordings as raw floats> <out folder>
# As prep.py does for the first sounds: each one is cut to its moment, cleared of rumble a phone cannot play, shaped where the
# recording needs it, brought to one loudness (as it will seem on a phone), and written as a WAV. encode.sh then makes the small
# MP3s the game loads. What is done to each one, and why, is written beside it. The recordings themselves are never changed.
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from dsp import *
from scipy import signal

SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
REF = -20.0          # every sound is written at this phone loudness (its loudest tenth of a second; a loop: its average), or as near as its peaks allow
report = {}


def src(name):
    return load(os.path.join(SRC, name + '.f32'))


def done(name, x, kind='shot', stereo=False, measure=loud, **more):
    x = np.asarray(x)
    if not stereo and x.shape[1] == 2: x = mono(x)
    x = normalise(x, REF, measure=measure)
    write_wav(os.path.join(OUT, name + '.wav'), x)
    report[name] = dict(kind=kind, stereo=bool(stereo), seconds=round(len(x) / SR, 3), peak=round(peak_db(x), 1),
                        loud=round(float(measure(x)), 1), **{k: (float(v) if isinstance(v, (np.floating, float)) else v) for k, v in more.items()})
    print(f"{name:<18} {len(x) / SR:6.2f} s  peak {peak_db(x):6.1f}  phone loudness {report[name]['loud']:6.1f}  {'stereo' if stereo else 'mono'}  {more if more else ''}")


def warm(x, f, amount, drive=3.0):
    """Give a sound that is nearly all deep bass something a phone can play: the bass below f is driven gently into a soft
    ceiling, which adds notes above it (its own overtones), and those overtones are mixed in. The putter keeps its beat."""
    lo = lp(x, f, 2); p = np.abs(lo).max() + 1e-12; h = np.tanh(drive * lo / p) * p / np.tanh(drive)
    return x + amount * hp(h - lo, f * .9, 2)


def best_period(x, lo, hi, fade):
    """A loop's length, between lo and hi seconds: the one at which the sound just after the end is most like the sound at the
    beginning (so the engine's beat carries straight on across the join). Also says how alike they are (1: the same)."""
    F = int(fade * SR); a = x[:F, 0] - x[:F, 0].mean(); best = (-2, 0)
    for P in range(int(lo * SR), int(hi * SR)):
        b = x[P:P + F, 0]; b = b - b.mean(); c = float(np.dot(a, b) / (np.sqrt(np.dot(a, a) * np.dot(b, b)) + 1e-20))
        if c > best[0]: best = (c, P)
    return best[1] / SR, best[0]


def loop_of(x, period, fade, alike):
    """A stretch that repeats without a join (as dsp.make_loop), for a sound with a beat: where the end is blended into the
    beginning the two are partly in step, so their blend is turned down by just as much as being in step makes it louder."""
    P, F = int(round(period * SR)), int(round(fade * SR)); assert len(x) >= P + F, (len(x) / SR, period + fade)
    r = .5 - .5 * np.cos(np.pi * np.arange(F) / F); g1, g2 = np.sqrt(r), np.sqrt(1 - r); k = 1 / np.sqrt(1 + 2 * max(0, alike) * g1 * g2)
    L = x[:P].copy(); L[:F] = (x[:F] * g1[:, None] + x[P:P + F] * g2[:, None]) * k[:, None]
    return L


def even(x, secs, power):
    """Slow swells evened out (by `power` of the way), so that nothing comes round that an ear could learn."""
    w = int(secs * SR); env = np.sqrt(np.convolve(x[:, 0] ** 2, np.ones(w) / w, 'same')); env = np.maximum(env, np.median(env) * .3)
    return x * ((env / np.median(env)) ** -power)[:, None]


def spread(L, secs=.5):
    w = int(secs * SR); sec = [10 * np.log10((L[i:i + w] ** 2).mean() + 1e-20) for i in range(0, len(L) - w, w)]; return round(max(sec) - min(sec), 1)


# ── the engine at its ordinary speed (a loop): "engine-loop" ──────────────────────────────────────────
# A soft purr: forty beats a second, nearly all of it between 300 and 1,000 Hz, so a phone plays it. It came very even (within a
# decibel from end to end). The rumble under 150 Hz is taken off. The game's faintest guiding notes (the knocks of a branch or a
# campfire on its way) lie between 450 and 700 Hz on a phone, and this sound never stops while he rides: so that it cannot cover
# them it is turned down by 5 dB just there, as the winter night is. About six seconds, its length chosen so that the beat
# carries on across the join.
x = mono(src('engine-loop')); x = hp(x, 150, 3); x = bell(x, 560, -5, q=1.1); x = cut(x, .30, 9.90); x = even(x, 1.0, .5)
P, c = best_period(x, 5.6, 6.4, .6); L = loop_of(x, P, .6, c)
done('engine-loop', pad_loop(L, .3), kind='loop', measure=loud_mean, period=round(P, 6), pad=.3, alike=round(c, 2), spread=spread(L))

# ── the engine right forward (a loop): "engine-fast-loop" ───────────────────────────────────────────
# A higher, eager hum on one note (188 Hz, with its overtones up to 3 kHz). Its first five and a half seconds are even; after
# that it sags and then swells, so only the first part is used. The same dip between 450 and 700 Hz, a little less of it.
x = mono(src('engine-fast-loop')); x = hp(x, 150, 3); x = bell(x, 560, -4, q=1.1); x = cut(x, .30, 5.60); x = even(x, .8, .6)
P, c = best_period(x, 3.9, 4.5, .6); L = loop_of(x, P, .6, c)
done('engine-fast-loop', pad_loop(L, .3), kind='loop', measure=loud_mean, period=round(P, 6), pad=.3, alike=round(c, 2), spread=spread(L))

# ── the engine starts: "ride-start" ──────────────────────────────────────────────────────────────────
# The starter whirs for two thirds of a second, the engine catches with a bang and settles into a low hum. The whir came 20 dB
# under the engine, so on a phone only the bang would be heard: it is brought up by 20 dB (heard in the game, with 13 it was
# still lost under the gift bursting open). The bang itself stood well above
# what follows: its loudest moment is rounded off. The hum it settles into is nearly all below 150 Hz: it is given overtones a
# phone can play (warm), the rumble under 130 Hz is taken off, and it is let fade over its last second, because by then the
# game's own engine loop has come up under it.
x = mono(src('ride-start')); x = warm(x, 240, .9); x = hp(x, 130, 2)
x = gain_curve(x, [(0, 12), (.07, 12), (.10, 20), (.60, 20), (.71, 0), (3.1, 0)])
T = np.abs(x).max() * .5; K = T * .5; x = np.where(np.abs(x) > T, np.sign(x) * (T + np.tanh((np.abs(x) - T) / K) * K), x)
x = cut(x, .0, 2.95); x = fade_in(x, .004); x = fade_out(x, 1.0)
done('ride-start', x)

# ── the lamp is out, the engine dies: "ride-stop" ──────────────────────────────────────────────────────────
# A slow putter, about ten beats a second, that weakens and stops: as asked. Nine tenths of it is below 150 Hz, which a phone
# cannot play: it is given overtones (warm), and then the rumble under 140 Hz is taken off.
x = mono(src('ride-stop')); x = warm(x, 260, 1.6); x = hp(x, 140, 2); x = cut(x, .10, 2.78); x = fade_in(x, .004); x = fade_out(x, .3)
done('ride-stop', x)

# ── brought forward, the engine rises: "rev-up" ──────────────────────────────────────────────────────────
# It rises for a little over a second and then eases. In the game the snowmobile is across the screen in half a second, so the
# rise has to be quicker than that: the sound begins a sixth of a second in (its first moments were only a murmur), and it is
# played a quarter faster (so it is over a quarter sooner, and four semitones higher: more eager).
x = mono(src('rev-up')); x = hp(x, 150); x = cut(x, .27, 1.72); x = resample(x, 1.25); x = fade_in(x, .025); x = fade_out(x, .35)
done('rev-up', x)

# ── dropping back, the engine sinks: "rev-down" ───────────────────────────────────────────────────────────
# The recording asked for ("slows down") came as a steady hum that does not sink. So this one is made from the full-speed hum:
# a second and a quarter of it played slower and slower (from its own speed down to six tenths of it, so its note falls by
# most of an octave), and dying away as it goes.
h = mono(src('engine-fast-loop')); h = hp(h, 150, 3); h = cut(h, 1.0, 3.4)[:, 0]
n = int(1.25 * SR); t = np.arange(n) / SR; u = np.clip(t / 1.0, 0, 1); rate = 1 - .42 * (u * u * (3 - 2 * u)); pos = np.cumsum(rate); pos = pos[pos < len(h) - 2]
i = pos.astype(int); f = pos - i; x = (h[i] * (1 - f) + h[i + 1] * f)[:, None]
x = gain_curve(x, [(0, 0), (.12, 0), (1.0, -11), (1.25, -17)]); x = fade_in(x, .04); x = fade_out(x, .3)
done('rev-down', x)

# ── it runs into a branch: "ride-bump" ────────────────────────────────────────────────────────────────
# A woody crack, a thump and a short rattle: as it came, without the boom under 140 Hz.
x = mono(src('ride-bump')); x = hp(x, 140); x = cut(x, .015, .92); x = fade_in(x, .002); x = fade_out(x, .15)
done('ride-bump', x)

# ── a ramp throws it: "ride-launch" ─────────────────────────────────────────────────────────────────
# A swish that rises. It came cut off at its loudest: it is let fade over its last fifth of a second.
x = mono(src('ride-launch')); x = hp(x, 180); x = cut(x, .115, .875); x = fade_in(x, .05); x = fade_out(x, .2)
done('ride-launch', x)

# ── BIG AIR: "big-air" ─────────────────────────────────────────────────────────────────────────
# A long rising rush of air with a shimmer of bells that comes in half way. Its very top (above 8 kHz, a quarter of it) is
# turned down by 4 dB so that it is bright, not hissy; it is let fade at the end, where it came cut off.
x = mono(src('big-air')); x = hp(x, 300); x = shelf(x, 8000, -4, 'high'); x = cut(x, .115, 1.9); x = fade_in(x, .06); x = fade_out(x, .3)
done('big-air', x)

# ── it comes down on the snow: "ride-land" ───────────────────────────────────────────────────────────────
# A soft heavy thump and snow settling. More than half of the thump is below 150 Hz: what a phone can play of it is kept. Its
# long faint tail is let go after three quarters of a second.
x = mono(src('ride-land')); x = hp(x, 150); x = cut(x, .015, .75); x = fade_in(x, .002); x = fade_out(x, .25)
done('ride-land', x)

# ── an icicle comes down on it: "ice-hit" ──────────────────────────────────────────────────────────────
# A crack and a clatter. It came dull (seven tenths of it below 150 Hz, little above 1 kHz), more a thud than ice: the boom is
# taken off and everything above 1.8 kHz is brought up by 6 dB, so that the clatter is heard. (The game plays the sound of an
# icicle breaking with it: together they are an icicle that broke on something hard.)
x = mono(src('ice-hit')); x = hp(x, 170); x = shelf(x, 1800, 6, 'high'); x = cut(x, .035, .92); x = fade_in(x, .002); x = fade_out(x, .15)
done('ice-hit', x)

# ── an icicle over it is about to fall: "ice-creak" ──────────────────────────────────────────────────────────
# Small glassy ticks and creaks, with a faint tinkle near the end. It came very quiet (45 dB under full), but clean: it is only
# brought up. A second and a half of it: the icicle shakes for 1.3 seconds.
x = mono(src('ice-creak')); x = hp(x, 500); x = cut(x, .115, 1.62); x = fade_in(x, .01); x = fade_out(x, .3)
done('ice-creak', x)

# ── a coin: "coin" ────────────────────────────────────────────────────────────────────────────
# One clear note, the C three octaves above middle C (2,092 Hz), held for most of a second and as loud at its end as at its
# start. A coin is struck and rings away, so it is given that shape (gone in about a third of a second); its sparkle above
# 6.5 kHz is turned down by 6 dB. The game plays it faster or slower, so that a run of coins rings up the scale.
x = mono(src('coin')); x = hp(x, 900); x = shelf(x, 6500, -6, 'high'); x = cut(x, .112, .56); x = strike(x, .6, .05, .16); x = fade_out(x, .06)
done('coin', x, hz=2092.0)

# ── GOOD TIDINGS is spelled: "tidings" ──────────────────────────────────────────────────────────────
# A quick rising run of bells that ends on a bright chord: as it came (it keeps its two channels). The chord came cut off at
# two seconds: it is let fade.
x = src('tidings'); x = hp(x, 180); x = cut(x, .115, 1.9); x = fade_in(x, .01); x = fade_out(x, .3)
done('tidings', x, stereo=True)

# ── the lamp is low: "lamp-low" ───────────────────────────────────────────────────────────────────
# Two soft falling notes on a glass bell. It came almost silent (54 dB under full) but clean: it is only brought up, and begins
# at its first note.
x = mono(src('lamp-low')); x = hp(x, 700); x = cut(x, .225, .92); x = fade_in(x, .004); x = fade_out(x, .1)
done('lamp-low', x)

json.dump(report, open(os.path.join(OUT, 'report.json'), 'w'), indent=1)
print('Not used: "slow-down" (a steady hum that does not sink: rev-down is made from the full-speed hum instead), "wind" (nearly all of it below 300 Hz: a phone cannot play it), "long-take" (kept as a spare: start, steady hum, wind-down and putter in one take).')
