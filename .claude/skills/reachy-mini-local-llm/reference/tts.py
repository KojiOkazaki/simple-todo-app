"""Local text-to-speech backends.

Each backend turns text into a ``(samples, samplerate)`` pair where ``samples``
is a 1-D float32 numpy array. The caller (``robot.py``) resamples it to the
robot's output rate and streams it to the speaker. Everything runs locally so
the whole pipeline (vision + speech) stays offline.

Backends:
    - voicevox : VOICEVOX engine over local HTTP (ずんだもん 等). Default.
    - macos    : macOS built-in `say` command (e.g. Kyoko for Japanese).
    - piper    : Piper neural TTS (needs a downloaded .onnx voice).
    - pyttsx3  : system speech engine fallback (no assets).
"""

from __future__ import annotations

import io
import logging
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from typing import Protocol, Tuple

import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)


class TextToSpeech(Protocol):
    def synthesize(self, text: str) -> Tuple[np.ndarray, int]:
        """Return mono float32 samples and their sample rate for ``text``."""


class VoicevoxTTS:
    """VOICEVOX engine over its local HTTP API (fully local, Japanese voices).

    Run the VOICEVOX app/engine (it serves http://127.0.0.1:50021 by default),
    then this backend POSTs to ``/audio_query`` + ``/synthesis`` to get WAV.
    Speaker ids: 3=ずんだもん(ノーマル), 2=四国めたん, 8=春日部つむぎ, ...
    """

    def __init__(self, host: str, speaker: int, timeout: float = 30.0) -> None:
        self._host = host.rstrip("/")
        self._speaker = int(speaker)
        self._timeout = timeout
        self._check_engine()

    def _check_engine(self) -> None:
        try:
            with urllib.request.urlopen(f"{self._host}/version", timeout=3.0) as resp:
                resp.read()
        except (urllib.error.URLError, OSError) as exc:
            raise RuntimeError(
                f"VOICEVOX engine not reachable at {self._host} ({exc}). "
                "Start the VOICEVOX app first."
            ) from exc

    def synthesize(self, text: str) -> Tuple[np.ndarray, int]:
        # 1) audio_query: build synthesis parameters for the text + speaker.
        query_url = f"{self._host}/audio_query?" + urllib.parse.urlencode(
            {"text": text, "speaker": self._speaker}
        )
        query = self._post(query_url)

        # 2) synthesis: render the query to a WAV (24kHz, 16-bit by default).
        synth_url = f"{self._host}/synthesis?" + urllib.parse.urlencode(
            {"speaker": self._speaker}
        )
        wav_bytes = self._post(
            synth_url, data=query, content_type="application/json"
        )

        samples, samplerate = sf.read(io.BytesIO(wav_bytes), dtype="float32")
        return _to_mono(samples), samplerate

    def _post(self, url: str, data: bytes = b"", content_type: str = "") -> bytes:
        headers = {"Content-Type": content_type} if content_type else {}
        request = urllib.request.Request(url, data=data, method="POST", headers=headers)
        with urllib.request.urlopen(request, timeout=self._timeout) as resp:
            return resp.read()


class MacSayTTS:
    """macOS built-in ``say`` command — high-quality offline TTS incl. Japanese.

    Use a Japanese voice such as "Kyoko" or "O-ren" (install extra voices via
    System Settings > Accessibility > Spoken Content if missing).
    """

    def __init__(self, voice: str = "") -> None:
        if sys.platform != "darwin":
            raise RuntimeError("The 'macos' TTS backend is only available on macOS.")
        if shutil.which("say") is None:
            raise RuntimeError("macOS 'say' command not found on PATH.")
        self._voice = voice

    def synthesize(self, text: str) -> Tuple[np.ndarray, int]:
        with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as tmp:
            audio_path = tmp.name
        try:
            cmd = ["say"]
            if self._voice:
                cmd += ["-v", self._voice]
            cmd += ["-o", audio_path, text]
            subprocess.run(cmd, capture_output=True, check=True)
            samples, samplerate = sf.read(audio_path, dtype="float32")
        finally:
            _safe_unlink(audio_path)
        return _to_mono(samples), samplerate


class PiperTTS:
    """Piper: fast, fully-local neural TTS. Requires the ``piper`` CLI + voice."""

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
            _safe_unlink(wav_path)
        return _to_mono(samples), samplerate


class Pyttsx3TTS:
    """Offline fallback TTS using the system speech engine (no model download)."""

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
            _safe_unlink(wav_path)
        return _to_mono(samples), samplerate


def build_tts(
    backend: str,
    *,
    piper_model: str = "",
    macos_voice: str = "",
    voicevox_host: str = "http://127.0.0.1:50021",
    voicevox_speaker: int = 3,
) -> TextToSpeech:
    """Create a TTS backend, falling back gracefully if it is unavailable."""
    backend = backend.lower()
    try:
        if backend == "voicevox":
            return VoicevoxTTS(voicevox_host, voicevox_speaker)
        if backend == "macos":
            return MacSayTTS(macos_voice)
        if backend == "piper":
            return PiperTTS(piper_model)
        if backend == "pyttsx3":
            return Pyttsx3TTS()
    except (RuntimeError, ValueError, FileNotFoundError) as exc:
        fallback = "macos" if sys.platform == "darwin" else "pyttsx3"
        logger.warning("TTS backend %r unavailable (%s); falling back to %r.",
                       backend, exc, fallback)
        return MacSayTTS(macos_voice) if fallback == "macos" else Pyttsx3TTS()
    raise ValueError(
        f"Unknown TTS backend: {backend!r} (use voicevox/macos/piper/pyttsx3)"
    )


def _to_mono(samples: np.ndarray) -> np.ndarray:
    samples = np.asarray(samples, dtype=np.float32)
    if samples.ndim > 1:
        samples = samples.mean(axis=1)
    return samples


def _safe_unlink(path: str) -> None:
    try:
        os.unlink(path)
    except OSError:
        pass
