"""
Art Alive: make Ben's Chatterbox voice files for the website.

What it does
  Reads voice-lines.csv (every fixed line the site speaks), makes one audio file per line
  in your cloned Chatterbox voice, and writes voice.json so the site plays your voice
  instead of the computer voice. Lines without a file keep using the computer voice.

How to run (Windows, in the same Python where Chatterbox works)
  1. Put a clean 10-20 second recording of your voice next to this file, named  my-voice.wav
  2. Open a terminal in this folder (the ART-ALIVE\\voice folder) and run:
         python make_voice.py
  3. In GitHub Desktop: Commit to main, then Push origin.

If you make the files another way (a Chatterbox app or website)
  Save each line as  <file>.mp3  (or .wav) in this folder, using the names in the
  "file" column of voice-lines.csv, then run:
         python make_voice.py --index
  That only rebuilds voice.json from the files that are here.
"""
import csv, json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "my-voice.wav")          # your voice sample
EXAGGERATION = 0.5                                 # 0.3 calm ... 0.8 very expressive
CFG = 0.5                                          # lower = slower, more deliberate

def norm(t): return " ".join(t.split())

def lines():
    with open(os.path.join(HERE, "voice-lines.csv"), encoding="utf-8") as f:
        return list(csv.DictReader(f))

def index():
    table = {}
    for row in lines():
        for ext in (".mp3", ".wav", ".m4a", ".ogg"):
            if os.path.exists(os.path.join(HERE, row["file"] + ext)):
                table[norm(row["text"])] = row["file"] + ext
                break
    with open(os.path.join(HERE, "voice.json"), "w", encoding="utf-8") as f:
        json.dump(table, f, ensure_ascii=False, indent=1)
    print(f"voice.json lists {len(table)} of {len(lines())} lines in your voice.")

def make():
    import torch, torchaudio as ta
    device = "cuda" if torch.cuda.is_available() else ("mps" if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available() else "cpu")
    print("Using", device, "(cpu works but is slow)")
    if not os.path.exists(REF):
        sys.exit("Put a 10-20 second recording of your voice here, named my-voice.wav, then run again.")
    from chatterbox.tts import ChatterboxTTS
    en = ChatterboxTTS.from_pretrained(device=device)
    mtl = None
    ffmpeg = shutil.which("ffmpeg")
    for row in lines():
        name, lang, text = row["file"], row["language"], row["text"]
        if any(os.path.exists(os.path.join(HERE, name + e)) for e in (".mp3", ".wav")):
            print("have", name); continue
        print("making", name, "-", text[:60])
        if lang == "en":
            wav, sr = en.generate(text, audio_prompt_path=REF, exaggeration=EXAGGERATION, cfg_weight=CFG), en.sr
        else:
            try:
                if mtl is None:
                    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
                    mtl = ChatterboxMultilingualTTS.from_pretrained(device=device)
                wav, sr = mtl.generate(text, language_id=lang, audio_prompt_path=REF, exaggeration=EXAGGERATION, cfg_weight=CFG), mtl.sr
            except Exception as e:
                print("  skipped (this Chatterbox has no", lang, "voice):", e); continue
        out = os.path.join(HERE, name + ".wav")
        ta.save(out, wav, sr)
        if ffmpeg:  # smaller files load faster on phones
            mp3 = os.path.join(HERE, name + ".mp3")
            if subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", out, "-ac", "1", "-b:a", "96k", mp3]).returncode == 0:
                os.remove(out)
    index()

if __name__ == "__main__":
    index() if "--index" in sys.argv else make()
