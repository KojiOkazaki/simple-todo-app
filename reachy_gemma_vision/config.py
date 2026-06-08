"""Configuration for the Reachy Mini + Gemma 4 vision/voice app.

All settings can be overridden with environment variables or CLI flags
(see ``app.py``). Defaults target a typical local setup: Ollama on
localhost serving Gemma 4 (E4B), Japanese output, and Piper TTS played
back through the robot's speaker.
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass

_IS_MACOS = sys.platform == "darwin"


@dataclass
class Config:
    # --- Ollama / Gemma 4 ----------------------------------------------------
    # Local Ollama endpoint. Gemma 4 is multimodal, so it accepts the camera
    # image directly. Pull the model first with e.g. `ollama pull gemma4:e4b`.
    ollama_host: str = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    model: str = os.environ.get("GEMMA_MODEL", "gemma4:e4b")
    # How to reach the model: "http" (/api/chat) or "cli" (shell out to
    # `ollama run`, which works for images where the HTTP API stalls).
    transport: str = os.environ.get("GEMMA_TRANSPORT", "http")

    # --- Language / persona --------------------------------------------------
    # "ja" -> Japanese system prompt + default question, anything else -> English.
    language: str = os.environ.get("REACHY_LANG", "ja")

    # --- Text-to-speech ------------------------------------------------------
    # Backends: "voicevox" (ずんだもん等, ローカルHTTP) | "macos" (`say`) |
    #           "piper" | "pyttsx3"
    # Default is VOICEVOX — fully local, high-quality Japanese voices.
    tts_backend: str = os.environ.get("TTS_BACKEND", "voicevox")

    # VOICEVOX engine (run the VOICEVOX app, which serves this HTTP API).
    voicevox_host: str = os.environ.get("VOICEVOX_HOST", "http://127.0.0.1:50021")
    # Speaker id. 3 = ずんだもん(ノーマル), 2 = 四国めたん, 8 = 春日部つむぎ ...
    voicevox_speaker: int = int(os.environ.get("VOICEVOX_SPEAKER", "3"))

    # macOS built-in `say` voice (used when tts_backend == "macos").
    macos_voice: str = os.environ.get("MACOS_TTS_VOICE", "Kyoko")

    # Path to a Piper voice (.onnx). Required when tts_backend == "piper".
    piper_model: str = os.environ.get("PIPER_MODEL", "")

    # --- Audio output target -------------------------------------------------
    # "reachy" -> speak through the robot speaker (default)
    # "file"   -> write each answer to a WAV file (handy for testing)
    audio_output: str = os.environ.get("AUDIO_OUTPUT", "reachy")

    # --- Reachy Mini media backend ------------------------------------------
    # "default" auto-detects local (USB) vs remote (WebRTC). For a robot
    # connected by USB to this machine, "default" resolves to the local backend.
    media_backend: str = os.environ.get("REACHY_MEDIA_BACKEND", "default")

    # JPEG quality used when encoding the frame sent to Gemma (1-100).
    jpeg_quality: int = int(os.environ.get("JPEG_QUALITY", "90"))

    # --- Voice input (speech-to-text) ---------------------------------------
    # Local Whisper model size: tiny / base / small / medium (larger = better,
    # slower). "small" is a good balance for Japanese.
    stt_model: str = os.environ.get("STT_MODEL", "small")
    stt_compute_type: str = os.environ.get("STT_COMPUTE_TYPE", "int8")
    # Mic energy threshold for voice activity detection (tune for your room).
    vad_threshold: float = float(os.environ.get("VAD_THRESHOLD", "0.015"))
