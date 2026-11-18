# The snowman game's sounds: how they were made ready

The sounds in `snowglobe/sounds/` were made by Ben in Runway (Seed Audio 1.0; twenty of them by Runway Agent) on 15 November 2026.
The files here are what turned his recordings into the small files the game loads. Nothing here is used by the site itself.

The recordings themselves are not kept here: Ben has them (the zip "Runway Agent - 20 generations", and the winter night he made first).

## To do it again (after a new take of a sound, say)

It needs Python 3 with numpy and scipy, and ffmpeg.

1. Give each recording its short name (the table below) and decode it to raw sound:
   `ffmpeg -i flake-1.mp3 -f f32le -ac 2 -ar 44100 st/flake-1.f32` (one for each; `st` is any empty folder).
2. `python3 prep.py st out` cuts, cleans and levels every sound and writes a WAV for each into `out`. What is done to each
   sound, and why, is written beside it in `prep.py` (where it is cut is in seconds from the start of the recording, so a new
   take needs new figures there).
3. `./encode.sh out out/mp3` makes the MP3s. Copy them into `snowglobe/sounds/`. (The files there now are these same MP3s with a
   content credential at the front of each: a small signed label, about 6 KB, added when Claude handed them over. The sound
   after it is the same, byte for byte.)
4. Decode those MP3s again (`ffmpeg -i out/mp3/flake-1.mp3 -f f32le -ar 44100 out/dec/flake-1.f32`, one for each) and run
   `python3 checkmp3.py out out/dec`. It prints how loud each file is as written, and checks that the two loops still join.
   Put any figure that has changed into `AS_WRITTEN` in `snowglobe/sounds.js`.

How loud each sound is *played* is not decided here: that is the `LOUD` line in `snowglobe/sounds.js`.

`dsp.py` is the small toolbox the others use (cutting, fading, filters, the measure of loudness "as on a phone").

## The snowmobile's sounds (18 November 2026)

Ben made seventeen more recordings in Runway (Runway Agent, Seed Audio 1.0; the zip "Runway Agent - 17 generations"). Fifteen files
for the game were made from them, the same way, by `prep_ride.py` instead of `prep.py`:

1. Give each recording its short name (the second table below) and decode it: `ffmpeg -i ride-start.mp3 -f f32le -ac 2 -ar 44100 st/ride-start.f32`.
2. `python3 prep_ride.py st out`, then `./encode.sh out out/mp3`, and copy the MP3s into `snowglobe/sounds/`.
3. Decode them again (`-ac 2` for `tidings`, `-ac 1` for the rest) and run `python3 checkmp3.py out out/dec`. Put any changed figure into
   `AS_WRITTEN` in `snowglobe/sounds.js`; and if a loop's length has changed (`period` in `out/report.json`), into `LOOP` there.

Runway named every file after the same opening words ("Sound effect only, no speech, …"), so six of them differ only by a number
that the download gave them. They can be told apart by length and by ear:

| Short name | The file as Runway named it (after "Agent Audio - Sound effect only_ no speech_ no voices_ no singing_ ") | What it is |
|---|---|---|
| `ride-start` | no music_ A small_ friendly snowm.mp3 (3 s) | the starter whirs, the engine catches |
| `engine-loop` | no music_ A small_ friendly snowm (1).mp3 (10 s) | cruising: a soft even purr |
| `slow-down` | no music_ A small_ friendly snowm (2).mp3 (2 s) | not used: a steady hum that does not sink |
| `rev-up` | no music_ A small_ friendly snowm (3).mp3 (2 s) | the engine rising |
| `engine-fast-loop` | no music_ A small_ friendly snowm (4).mp3 (10 s) | full speed: a higher hum on one note |
| `ride-stop` | no music_ A small_ friendly snowm (5).mp3 (3 s) | a slow putter that dies |
| `ride-bump` | no music_ A small snowmobile runs.mp3 | into a branch |
| `ride-launch` | no music_ A small snowmobile shoo.mp3 | off the top of a ramp |
| `ride-land` | no music_ A small snowmobile land.mp3 | down into the snow |
| `big-air` | A joyful big jump in a children_s.mp3 | a rising rush of air, with bells |
| `ice-hit` | no music_ A big icicle falls and.mp3 | an icicle smashes on the snowmobile |
| `ice-creak` | no music_ An icicle overhead is a.mp3 | an icicle about to break loose |
| `coin` | A single gold coin is collected i.mp3 | one note: the C three octaves above middle C |
| `tidings` | A short_ happy flourish for spell.mp3 | GOOD TIDINGS is spelled |
| `lamp-low` | A gentle warning that a lamp is r.mp3 | two soft notes |
| `wind` | no music_ Cold air rushing past a.mp3 (10 s) | not used: nearly all of it below 300 Hz, which a phone cannot play |
| `long-take` | no music_ One long continuous tak.mp3 (20 s) | not used: a spare (start, steady hum, wind-down and putter in one take) |

`rev-down` (the engine sinking) has no recording of its own: `prep_ride.py` makes it from `engine-fast-loop`, played slower and slower.

## Which recording is which

| Short name | The file as Runway named it |
|---|---|
| `night-loop` | Seed_Audio_1_0_-_A_quiet_snowy_night_in_a_pine_wood__Soft__steady_wind_high_in_the_trees_and_the_hus.mp3 (the first one, made by itself) |
| `burn` | Agent Audio - A woolly hat and scarf catch fire for a moment a quick soft _fwoomp_ as small flames c.mp3 |
| `campfire-loop` | Agent Audio - A small_ cosy campfire burning steadily gentle crackles and pops of dry wood over a so.mp3 |
| `card` | Agent Audio - A soft_ pleasant _ta-da_ as a score appears two quick rising notes on a celesta or sma.mp3 |
| `finale` | Agent Audio - A warm_ magical swell for the happy ending of a children_s holiday game sparkling chim.mp3 |
| `flake-1` | Agent Audio - A tiny soft pat of powdery snow_ like a small snowball landing in a woollen mitten_ wi.mp3 |
| `flake-2` | Agent Audio - A tiny soft pat of powdery snow_ like a small snowball landing in a woollen mitten_ wi (1).mp3 |
| `flake-3` | Agent Audio - A tiny soft pat of powdery snow_ like a small snowball landing in a woollen mitten_ wi (2).mp3 |
| `flake-big` | Agent Audio - A soft_ fluffy puff of snow with a small bright twinkle_ like a big snowflake landing_.mp3 |
| `gift` | Agent Audio - A small present bursts open a quick rip of wrapping paper and a soft pop_ then a brigh.mp3 |
| `icicle` | Agent Audio - An icicle falls and breaks on packed snow one short crisp crack_ then a bright tinklin.mp3 |
| `jump` | Agent Audio - A soft_ springy cartoon jump a quick_ light whoosh of air going up_ rising a little in.mp3 |
| `land` | Agent Audio - A soft thump into deep powdery snow with a small crisp crunch_ like something round an.mp3 |
| `letter` | Agent Audio - One bright_ warm_ glassy chime_ struck once_ followed by a short shimmer of tiny spark.mp3 |
| `piece` | Agent Audio - A soft_ neat snap-click_ like a wooden toy piece popping into place_ with a tiny pat o.mp3 |
| `shake` | Agent Audio - A snow globe is shaken a soft swirling whoosh of snow and water inside glass_ with a f.mp3 |
| `tap` | Agent Audio - One soft wooden tap_ like a fingertip on a small wooden block_ Very short_ round and q.mp3 |
| `top-score` | Agent Audio - A short_ happy fanfare for a new top score in a children_s holiday game bright celesta.mp3 |
| `trip` | Agent Audio - A cartoon tumble in the snow a short woody knock against a thick branch_ then a quick.mp3 |
| `walk-loop` | Agent Audio - Someone shuffling slowly through fresh snow soft_ even crunches_ two each second_ clos.mp3 |
| `zoom` | Agent Audio - A smooth magical whoosh that draws inward and rises for one second_ one soft bright ch.mp3 |

Not used: `shake` (it came almost silent). The walk (`walk-loop`) became the five files `step-1` … `step-5`.
