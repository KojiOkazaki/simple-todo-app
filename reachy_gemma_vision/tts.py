"""Local text-to-speech backends.

Each backend turns text into a ``(samples, samplerate)`` pair where ``samples``
is a 1-D float32 numpy array. The caller (``robot.py``) resamples it to the
robot's output rate and streams it to the speaker. Everything runs locally so
the whole pipeline (vision + speech) stays offline.
"""

from __future__ import annotations

import logging
import os
import subprocess
import tempfile
from typing import Protocol, Tuple

import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)


class TextToSpeech(Protocol):
    def synthesize(self, text: str) -> Tuple[np.ndarray, int]:
        """Return mono float32 samples and their sample rate for ``text``."""


class PiperTTS:
    """Piper: fast, fully-local neural TTS with high-quality Japanese voices.

    Requires the ``piper`` CLI on PATH and a downloaded ``.onnx`` voice model.
    """

    def __init__(self, model_path: str) -> None:
        if not model_path:
            raise ValueError(
                "PIPER_MODEL is not set. Point it at a Piper voice .onnx file "
                "(see README for download instructions)."
            )
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Piper voice model not found: {model_path}")
        self._model_path = model_path

    def synthesize(self, text: str) -> Tuple[np.ndarray, int]:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            wav_path = tmp.name
        try:
            subprocess.run(
                ["piper", "--model", self._model_path, "--output_file", wav_path],
                input=text.encode("utf-8"),
                capture_output=True,
                check=True,
            )
            samples, samplerate = sf.read(wav_path, dtype="float32")
        finally:
            try:
                os.unlink(wav_path)
            except OSError:
                pass
        return _to_mono(samples), samplerate


class Pyttsx3TTS:
    """Offline fallback TTS using the system speech engine (no model download).

    Quality is lower and Japanese support depends on the installed system
    voices (e.g. espeak-ng), but it needs no extra assets.
    """

    def __init__(self) -> None:
        import pyttsx3  # imported lazily so it's only required when used

        self._pyttsx3 = pyttsx3

    def synthesize(self, text: str) -> Tuple[np.ndarray, int]:
        engine = self._pyttsx3.init()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            wav_path = tmp.name
        try:
            engine.save_to_file(text, wav_path)
            engine.runAndWait()
            samples, samplerate = sf.read(wav_path, dtype="float32")
        finally:
            try:
                os.unlink(wav_path)
            except OSError:
                pass
        return _to_mono(samples), samplerate


def build_tts(backend: str, piper_model: str = "") -> TextToSpeech:
    """Create a TTS backend, falling back to pyttsx3 if Piper is unavailable."""
    backend = backend.lower()
    if backend == "piper":
        try:
            return PiperTTS(piper_model)
        except (ValueError, FileNotFoundError) as exc:
            logger.warning("Piper unavailable (%s); falling back to pyttsx3.", exc)
            return Pyttsx3TTS()
    if backend == "pyttsx3":
        return Pyttsx3TTS()
    raise ValueError(f"Unknown TTS backend: {backend!r} (use 'piper' or 'pyttsx3')")


def _to_mono(samples: np.ndarray) -> np.ndarray:
    samples = np.asarray(samples, dtype=np.float32)
    if samples.ndim > 1:
        samples = samples.mean(axis=1)
    return samples
