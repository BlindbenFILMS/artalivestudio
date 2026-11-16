# The sounds from Runway, made ready for the game.
#   python3 -I prep.py <folder of the stereo recordings as raw floats> <out folder>
# Each sound is cut to its moment, cleared of rumble a phone cannot play, shaped where the recording needs it, brought to one
# loudness (as it will seem on a phone), and written as a WAV. encode.sh then makes the small MP3s the game loads.
# What is done to each one, and why, is written beside it. The recordings themselves are never changed.
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from dsp import *
from scipy import signal

SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
FRAME = 1152          # an MP3 is written in frames of 1,152 samples: a loop that is a whole number of them is coded the same way each time round
NIGHT, FIRE = 689 * FRAME / SR, 306 * FRAME / SR   # 17.998 s and 7.993 s
REF = -20.0          # every sound is written at this phone loudness (its loudest tenth of a second), or as near as its peaks allow
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
    print(f"{name:<14} {len(x) / SR:6.2f} s  peak {peak_db(x):6.1f}  phone loudness {report[name]['loud']:6.1f}  {'stereo' if stereo else 'mono'}  {more if more else ''}")


# ── the winter night (a loop) ────────────────────────────────────────────────────────────────────────────────
# Nine tenths of it is below 200 Hz, which a phone cannot play and which would only use up room. What is kept is the hush between
# 260 and 2,400 Hz (above that it is plain hiss). Slow swells are evened out by about half, so nothing comes round again that an
# ear could learn. 18 seconds, the end blended into the beginning over a second and a half.
# The game's faintest guiding notes are the low knocks of a branch or a campfire on its way; what a phone plays of them lies
# between 450 and 700 Hz. So that this sound, which never stops, cannot cover them, it is turned down by 7 dB just there.
x = mono(src('night-loop')); x = lp(hp(x, 260, 3), 2400); x = bell(x, 560, -7, q=1.1)
x = cut(x, .30, 19.85)
w = int(1.5 * SR); env = np.sqrt(np.convolve(x[:, 0] ** 2, np.ones(w) / w, 'same')); env = np.maximum(env, np.median(env) * .25)
x = x * ((env / np.median(env)) ** -.55)[:, None]
# Six sharp ticks (a millisecond or two long, 15 to 20 dB above the hush) are rounded down into it: "no sudden sounds".
r = np.sqrt((x ** 2).mean()); T = r * 3.2; K = T * .3; n0 = int((np.abs(x) > T).sum())
x = np.where(np.abs(x) > T, np.sign(x) * (T + np.tanh((np.abs(x) - T) / K) * K), x); print('night: samples rounded off', n0, 'of', len(x))
L = make_loop(x, NIGHT, 1.5)
sec = [10 * np.log10((L[i:i + SR] ** 2).mean() + 1e-20) for i in range(0, len(L) - SR, SR)]
done('night-loop', pad_loop(L, .3), kind='loop', measure=loud_mean, period=round(NIGHT, 6), pad=.3, spread=round(max(sec) - min(sec), 1))

# ── the campfire (a loop) ───────────────────────────────────────────────────────────────────────────────────
# Its low roar (93% of it, below 200 Hz) would be lost on a phone and boom on headphones; the crackle is what says "fire". So the
# roar is turned well down (nothing much below 220 Hz), leaving a little flutter under the crackle. One pop stood 4 dB above
# every other: the few loudest are rounded off, so that no single pop is heard coming round. 8 seconds, blended over one second.
x = mono(src('campfire-loop')); x = hp(x, 220); x = cut(x, .25, 9.85)
lo = signal.sosfiltfilt(signal.butter(2, 1200, 'lowpass', fs=SR, output='sos'), x, axis=0); hi = x - lo   # the flutter, and the crackle
def pops(v):   # each pop's highest sample, loudest first
    a = np.abs(v[:, 0]); w = int(.012 * SR); idx = [i for i in range(w, len(a) - w, 2) if a[i] > 0 and a[i] == a[i - w:i + w].max()]
    return np.array(sorted((a[i] for i in idx), reverse=True))
pk = pops(hi); T = pk[7]; K = T * .6          # the eighth loudest pop: above its height, a pop is rounded off (to 4 dB over it at the most)
hi = np.where(np.abs(hi) > T, np.sign(hi) * (T + np.tanh((np.abs(hi) - T) / K) * K), hi)
pk2 = pops(hi); print('campfire: the loudest pops before', np.round(20 * np.log10(pk[:8]), 1), 'after', np.round(20 * np.log10(pk2[:8]), 1), '(the 30th:', round(float(20 * np.log10(pk2[29])), 1), ')')
x = lo + hi
L = make_loop(x, FIRE, 1.0)
sec = [10 * np.log10((L[i:i + SR // 2] ** 2).mean() + 1e-20) for i in range(0, len(L) - SR // 2, SR // 2)]
done('campfire-loop', pad_loop(L, .3), kind='loop', period=round(FIRE, 6), pad=.3, spread=round(max(sec) - min(sec), 1))

# ── a small snowflake caught: three takes ───────────────────────────────────────────────────────────────────
# Each take came as a faint, even hiss for most of a second, with no "pat" in it. A pat is short and dies away at once, so each is
# given that shape: a 3 ms rise, then gone in about a fifth of a second; and it is kept to the middle of the range (a pat of snow
# is soft, not hissy: between about 450 and 2,000 Hz). The three differ a little in colour and length, so fifty catches are not one sound fifty times.
for name, a0, lo, hi, tau in [('flake-1', .119, 450, 2200, .036), ('flake-2', .023, 500, 1800, .030), ('flake-3', .120, 400, 1500, .044)]:
    x = mono(src(name)); x = lp(hp(x, lo), hi, 4); x = cut(x, a0, a0 + .26)
    x = strike(x, 1, tau, tau); x = fade_out(x, .03)
    done(name, x)

# ── a big snowflake caught ──────────────────────────────────────────────────────────────────────────────────
# A soft puff that swells and dies: used as it is, from just before it swells, and let go a little sooner (it trailed on for
# half a second).
x = mono(src('flake-big')); x = hp(x, 160); x = cut(x, .228, .80); x = fade_in(x, .02); x = decay(x, .30, .11); x = fade_out(x, .05)
done('flake-big', x)

# ── a letter caught ─────────────────────────────────────────────────────────────────────────────────────────
# It came as one held, glassy chord (D, with G and B above it), as loud at its end as at its start, with most of its strength
# above 8 kHz. A chime is struck and rings away, so it is given that shape; the very top is turned down by 10 dB so that it
# is bright, not shrill; the noise under 600 Hz is taken away. Its lowest clear note is D6 (1171.5 Hz): the game plays it faster
# or slower so that it is the note of each letter.
x = mono(src('letter')); x = hp(x, 600); x = shelf(x, 7000, -10, 'high'); x = cut(x, .118, .93)
x = strike(x, .55, .07, .30); x = fade_out(x, .04)
done('letter', x, hz=1171.5)

# ── a gift opens ────────────────────────────────────────────────────────────────────────────────────────────
# Rip, pop, sparkle, as asked. The sparkle stopped dead at the end: it is let fade. Its very top (10 to 13 kHz) was as loud as
# anything in it: turned down by 5 dB.
x = mono(src('gift')); x = hp(x, 160); x = shelf(x, 8000, -5, 'high'); x = cut(x, .150, .945)
x = decay(x, .47, .13); x = fade_out(x, .03)
done('gift', x)

# ── a piece lands in its place ──────────────────────────────────────────────────────────────────────────────
# Snap, click: as it came.
x = mono(src('piece')); x = hp(x, 120); x = cut(x, .072, .47); x = fade_in(x, .004); x = fade_out(x, .07)
done('piece', x)

# ── a jump ──────────────────────────────────────────────────────────────────────────────────────────────────
# A soft "whoop" that rises. Its first third of a second was only a faint hiss before the whoop: the sound now begins just
# before the whoop, so that it answers the press.
x = mono(src('jump')); x = hp(x, 220); x = cut(x, .415, .92); x = fade_in(x, .04); x = fade_out(x, .13)
done('jump', x)

# ── a landing ───────────────────────────────────────────────────────────────────────────────────────────────
# A thump with a crunch. Most of the thump is below 200 Hz: what a phone can play of it is kept, the boom under 170 Hz is not.
# Its long faint tail is let go after a quarter of a second.
x = mono(src('land')); x = hp(x, 170); x = cut(x, .119, .52); x = fade_in(x, .002); x = decay(x, .16, .07); x = fade_out(x, .04)
done('land', x)

# ── burnt by the campfire ───────────────────────────────────────────────────────────────────────────────────
# "Fwoomp", then a hiss that dies away. The hiss came 19 dB under the fwoomp: on a phone only the first moment would be heard.
# So the hiss is brought up by 8 dB (smoothly, over the first half second), and the boom under 200 Hz is taken off.
x = mono(src('burn')); x = hp(x, 200); x = cut(x, .112, 1.93); x = fade_in(x, .002)
x = gain_curve(x, [(0, 0), (.09, 0), (.55, 8), (1.82, 8)]); x = fade_out(x, .25)
done('burn', x)

# ── tripped by a branch ─────────────────────────────────────────────────────────────────────────────────────
# Knock, tumble, plop. In the game his tumble takes nine tenths of a second, and the recording's plop came after a second and a
# half. The middle of the tumble is shortened (a blend, inside the rolling) so that the plop lands as he comes up.
x = mono(src('trip')); x = hp(x, 150)
KNOCK, PLOP, LEAD, ROLL = .162, 1.735, .012, .9        # where the knock and the plop begin in the recording; a hair of lead-in; the game's tumble
a = cut(x, KNOCK - LEAD, KNOCK - LEAD + .80); b = cut(x, PLOP - (LEAD + ROLL - .74) - .0, 1.925)   # b begins .06 s before a ends
x = xfade(a, b, .06); x = fade_in(x, .003); x = fade_out(x, .06)
done('trip', x, plop=round(LEAD + ROLL, 3))

# ── an icicle breaks ────────────────────────────────────────────────────────────────────────────────────────
# Crack, a second smaller break, then a scatter of small pieces. The scatter came 20 dB under the crack: its last third of a second
# is brought up by 8 dB so that it is heard; the boom under 200 Hz is taken off.
x = mono(src('icicle')); x = hp(x, 200); x = cut(x, .151, .86); x = fade_in(x, .002)
x = gain_curve(x, [(0, 0), (.34, 0), (.50, 8), (.71, 8)]); x = fade_out(x, .2)
done('icicle', x)

# ── a button pressed ────────────────────────────────────────────────────────────────────────────────────────
# The recording holds four taps, not one. The last is the clearest: it alone is kept.
x = mono(src('tap')); x = hp(x, 150); x = cut(x, .8635, .94); x = fade_in(x, .002); x = fade_out(x, .035)
done('tap', x)

# ── walking in the snow: five steps ─────────────────────────────────────────────────────────────────────────
# The recording is five crunches, each a little different. They are cut apart, so the game can put one under each of his steps
# (and none while he is in the air). Each is brought to the same loudness, as the prompt asked, and kept above 700 Hz, clear of the
# low knocks that tell a player something is coming (there are two steps a second: they must not sit on a guiding note).
for k, (a0, b0, fin) in enumerate([(.262, .56, .012), (1.022, 1.36, .004), (1.850, 2.19, .004), (2.655, 3.00, .008), (3.433, 3.78, .006)]):
    x = mono(src('walk-loop')); x = hp(x, 700); x = cut(x, a0, b0); x = fade_in(x, fin); x = decay(x, .10, .09); x = fade_out(x, .05)
    done(f'step-{k + 1}', x)

# ── into the logo and out ───────────────────────────────────────────────────────────────────────────────────
# A whoosh that swells for a second and falls away, with a shimmer in it. It stopped dead at the end: let fade.
x = src('zoom'); x = hp(x, 150); x = cut(x, .115, 2.93); x = fade_in(x, .03); x = fade_out(x, .7)
done('zoom', x, stereo=True)

# ── the score card opens ────────────────────────────────────────────────────────────────────────────────────
# Two rising notes on a celesta: E and G, then C on top. A chord of C major, in tune with the game. As it came.
x = src('card'); x = hp(x, 200); x = cut(x, .108, .96); x = fade_in(x, .002); x = fade_out(x, .05)
done('card', x, stereo=True)

# ── in the top three ────────────────────────────────────────────────────────────────────────────────────────
# A run that climbs from C to the C two octaves up, and rings. As it came.
x = src('top-score'); x = hp(x, 150); x = cut(x, .232, 2.78); x = fade_in(x, .002); x = fade_out(x, .3)
done('top-score', x, stereo=True)

# ── the phrase is finished ──────────────────────────────────────────────────────────────────────────────────
# A warm swell that opens into a chord and rings out. The chord it opens into is A flat major (A flat, C, E flat, with F and B flat),
# and the game rings C, E, G at that moment: a semitone apart, three times over. Played a major third higher (as a record played
# faster: 1.26 times) it is C major (C, E, G, with A and D), and it also reaches its height just as the phrase finishes forming.
x = src('finale'); x = cut(x, .085, 4.72); x = resample(x, 2 ** (4 / 12)); x = hp(x, 120); x = fade_in(x, .02); x = fade_out(x, .3)
done('finale', x, stereo=True, shifted='+4 semitones')

json.dump(report, open(os.path.join(OUT, 'report.json'), 'w'), indent=1)
print('\n', len(report), 'sounds;', round(sum(v['seconds'] for v in report.values()), 1), 'seconds in all')
