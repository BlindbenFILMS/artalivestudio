#!/bin/bash
# The prepared WAVs → the small MP3s the game loads.   encode.sh <folder of wavs> <out folder>
# Short sounds: one channel at 96 kbps (sharp starts stay sharp). The campfire and the snowmobile's two engine loops: 64. The winter
# night (nothing above 2.4 kHz in it): 48. The five musical ones keep their two channels, at 128.
set -e
IN="$1"; OUT="$2"; mkdir -p "$OUT"
for w in "$IN"/*.wav; do
  n=$(basename "$w" .wav)
  case "$n" in
    night-loop) o="-ac 1 -b:a 48k" ;;
    campfire-loop|engine-loop|engine-fast-loop) o="-ac 1 -b:a 64k" ;;
    zoom|card|top-score|finale|tidings) o="-ac 2 -b:a 128k" ;;
    *) o="-ac 1 -b:a 96k" ;;
  esac
  ffmpeg -hide_banner -v error -y -i "$w" -map_metadata -1 -fflags +bitexact -flags:a +bitexact -c:a libmp3lame $o -ar 44100 -id3v2_version 0 -write_id3v1 0 "$OUT/$n.mp3"
done
ls -l "$OUT" | awk 'NR>1 {s+=$5; printf "%8d  %s\n", $5, $9} END {printf "%8d  in all (%d files)\n", s, NR-1}'
