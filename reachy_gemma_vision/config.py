"""Configuration for the Reachy Mini + Gemma 4 vision/voice app.

All settings can be overridden with environment variables or CLI flags
(see ``app.py``). Defaults target a typical local setup: Ollama on
localhost serving Gemma 4 (E4B), Japanese output, and Piper TTS played
back through the robot's speaker.
"""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class Config:
    # --- Ollama / Gemma 4 ----------------------------------------------------
    # Local Ollama endpoint. Gemma 4 is multimodal, so it accepts the camera
    # image directly. Pull the model first with e.g. `ollama pull gemma4:e4b`.
    ollama_host: str = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    model: str = os.environ.get("GEMMA_MODEL", "gemma4:e4b")

    # --- Language / persona --------------------------------------------------
    # "ja" -> Japanese system prompt + default question, anything else -> English.
    language: str = os.environ.get("REACHY_LANG", "ja")

    # --- Text-to-speech ------------------------------------------------------
    tts_backend: str = os.environ.get("TTS_BACKEND", "piper")  # "piper" | "pyttsx3"
    # Path to a Piper voice (.onnx). Required when tts_backend == "piper".
    # Download a Japanese voice, e.g. from https://huggingface.co/rhasspy/piper-voices
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
