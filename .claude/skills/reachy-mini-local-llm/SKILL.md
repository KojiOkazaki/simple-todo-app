---
name: reachy-mini-local-llm
description: >-
  Build or debug a Reachy Mini (Pollen Robotics) app that CONVERSES with the
  user and/or does CAMERA IMAGE RECOGNITION using a LOCAL LLM. Use whenever the
  task involves Reachy Mini + a local/offline model (Ollama + Gemma / gemma3 /
  gemma4), local speech-to-text (faster-whisper), or local text-to-speech
  (macOS `say`, VOICEVOX/ずんだもん, Piper). Covers the Reachy Mini Python SDK
  camera & audio APIs and — most importantly — the non-obvious gotchas that
  otherwise cost hours (Ollama image hangs, the Reachy mic returning silence,
  macOS mic permission, model-load latency).
---

# Reachy Mini + Local LLM (voice chat + vision)

Goal: talk to Reachy Mini by voice and/or have it describe what its camera
sees, entirely with **local** models. Pipeline:

```
voice → mic → faster-whisper (STT) → Ollama (Gemma, +image) → TTS → Reachy speaker
camera frame ─────────────────────────┘
```

A complete, working reference implementation is in `reference/` (copy it into
the target repo and adapt). Read the gotchas below BEFORE writing code — they
are the whole point of this skill.

## ⚠️ Hard-won gotchas (read first)

1. **Talk to Ollama over HTTP `/api/chat` directly (stdlib `urllib`), NOT the
   `ollama` Python package.** The package *stalled indefinitely* on image
   requests on a real setup while the CLI worked. Direct HTTP is reliable.

2. **Never send `think: false` together with an image to Gemma 4** on Ollama
   0.30.x — the server never responds (looks like a total hang, 5-min timeout).
   Just omit `think` (server default = thinking on). `gemma3` is not a thinking
   model, so it answers directly and fast — prefer it for snappy use.

3. **Interrupted requests clog the Ollama server.** Symptom: suddenly *every*
   request (even a fresh small model, even text) times out. Fix:
   `pkill -9 -f ollama` then restart Ollama. Don't spam Ctrl+C mid-request.

4. **Send images as base64 strings** in the message `images: [...]` field
   (`base64.b64encode(jpeg).decode()`).

5. **First vision call loads GBs and runs image prefill → long silence.** Use
   `keep_alive: "30m"` to keep the model resident, and print a **heartbeat**
   (dots) so it doesn't look frozen. It is NOT hung; wait.

6. **Model choice matters a lot on a laptop.** `gemma3:4b` (~3.3 GB, no
   thinking, stable vision) is the smooth default. Gemma 4 works too but is a
   *thinking* model and larger (`gemma4:e2b` ~7.2 GB, `gemma4:e4b` ~9.6 GB) →
   slower for vision. Downscale frames to ≤768 px before sending.

7. **The Reachy Mini SDK mic often returns pure silence (RMS 0.0000)** via the
   LOCAL/GStreamer path, even though `system_profiler SPAudioDataType` shows
   the USB "Reachy Mini Audio" input and the **speaker output works fine**.
   Don't fight it — capture audio with **`sounddevice`** from the Mac mic (or
   the Reachy device by name). See `reference/mic.py`.

8. **macOS microphone permission**: a denied mic returns *silence, not an
   error* (and output still works, which is misleading). Grant the terminal app
   mic access in System Settings → Privacy & Security → Microphone.
   `sounddevice`/PortAudio triggers the prompt reliably; `tccutil reset
   Microphone` re-triggers it. Diagnose levels with `reference/diag_mic.py`.

9. **Conversation coherence**: do NOT attach the camera image every turn — the
   model then narrates the scene instead of chatting. Attach the frame only
   when the user asks about what's visible (keyword heuristic), otherwise do a
   text-only turn. Use a conversation-first system prompt.

10. **Always isolate with the diagnostics first** (`reference/diag_vision.py`,
    `reference/diag_mic.py`) before wiring the full robot loop. They pinpoint
    whether the problem is the model, the HTTP path, the mic, or permissions.

## Reachy Mini SDK API (verified)

```python
from reachy_mini import ReachyMini
with ReachyMini(media_backend="default") as mini:   # auto-detects USB/local
    # Camera: (H, W, 3) uint8, OpenCV BGR. May be None during warm-up → retry.
    frame = mini.media.get_frame()

    # Speaker (works well): float32, mono ok, at get_output_audio_samplerate()
    # (16 kHz). push_audio_sample is NON-blocking → sleep for the clip length.
    mini.media.start_playing()
    mini.media.push_audio_sample(samples_float32)   # in ~1024-sample chunks
    mini.media.stop_playing()

    # Mic (OFTEN SILENT — prefer sounddevice instead):
    mini.media.start_recording()
    s = mini.media.get_audio_sample()               # (n, 2) float32 @ 16 kHz
    doa, is_speech = mini.media.get_DoA()
    mini.media.stop_recording()
```

Docs: https://huggingface.co/docs/reachy_mini/SDK/python-sdk

## Ollama HTTP (the reliable path)

```python
import json, urllib.request, base64
payload = {
    "model": "gemma3:4b",
    "messages": [{"role": "user", "content": prompt,
                  "images": [base64.b64encode(jpeg).decode()]}],  # omit for chit-chat
    "stream": True,
    "keep_alive": "30m",
    # DO NOT add "think": False with an image on Gemma 4 → it hangs.
}
req = urllib.request.Request("http://localhost:11434/api/chat",
        data=json.dumps(payload).encode(), method="POST",
        headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=300) as resp:
    for line in resp:                       # NDJSON, one JSON object per line
        obj = json.loads(line)
        piece = (obj.get("message") or {}).get("content") or ""
        ...
        if obj.get("done"): break
```

## Setup (macOS, Reachy Mini lite over USB)

```bash
# 1. Ollama + a local multimodal model
brew install ollama && ollama serve           # leave running
ollama pull gemma3:4b                          # fast, stable vision (recommended)
# (Gemma 4 option: ollama pull gemma4:e2b — slower, thinking model)

# 2. Python deps (see reference/requirements.txt)
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt               # reachy-mini, opencv, numpy, scipy,
                                               # soundfile, faster-whisper, sounddevice
# 3. Verify in isolation BEFORE the full app:
python diag_vision.py --model gemma3:4b        # vision via Ollama works?
python diag_mic.py --sd                        # Mac mic captures? (grant permission)

# 4. Run: voice chat + vision, Mac mic in, Reachy speaker out, macOS Kyoko voice
python app.py --voice --mic sd --tts-backend macos --model gemma3:4b
```

## TTS options (local, Japanese-friendly)

- **macOS `say`** — zero install, good JP voice: `say -v Kyoko -o out.aiff "..."`
  then read with soundfile. Simplest reliable default on a Mac.
- **VOICEVOX (ずんだもん)** — run the engine, POST `/audio_query` then
  `/synthesis` on `http://127.0.0.1:50021` (speaker id 3 = ずんだもん). Returns WAV.
- **Piper** — neural TTS; needs a downloaded `.onnx` voice.

Resample TTS output to `get_output_audio_samplerate()` and push in chunks; the
push is non-blocking so sleep for the clip duration.

## Build order that avoids the rabbit holes

1. `diag_vision.py` → confirm Ollama vision + measure latency. If it hangs:
   check for `think:false`, clogged server (`pkill -9 -f ollama`), or wrong model.
2. Camera + Ollama + TTS one-shot (`--once`) → confirm describe→speak.
3. `diag_mic.py --sd` → confirm mic + macOS permission; note the suggested
   `VAD_THRESHOLD`.
4. Add the voice loop (`--voice --mic sd`) and the chit-chat-vs-vision routing.

## Reference implementation (in `reference/`)

| file | role |
|------|------|
| `app.py` | entry point: text & voice loops, vision-intent routing, heartbeat |
| `gemma_client.py` | Ollama `/api/chat` over HTTP (stream), base64 image, keep_alive, CLI fallback |
| `robot.py` | Reachy SDK wrapper: camera capture (+downscale/retry), speaker playback |
| `mic.py` | `sounddevice` mic capture with energy VAD (use this, not the SDK mic) |
| `stt.py` | faster-whisper STT (`condition_on_previous_text=False`) |
| `tts.py` | VOICEVOX / macOS `say` / Piper / pyttsx3 backends |
| `config.py` | env-driven settings |
| `diag_vision.py`, `diag_mic.py` | isolation diagnostics (run these first) |

Install as a personal skill for future Claude Code sessions:
`cp -r .claude/skills/reachy-mini-local-llm ~/.claude/skills/`
