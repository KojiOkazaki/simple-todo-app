"""Local speech-to-text using faster-whisper (fully offline).

Turns recorded microphone audio (float32) into text. faster-whisper runs
locally on CPU and has solid Japanese support. The model is downloaded from
Hugging Face on first use and cached.
"""

from __future__ import annotations

import logging

import numpy as np

logger = logging.getLogger(__name__)


class WhisperSTT:
    def __init__(
        self,
        model_size: str = "small",
        language: str = "ja",
        compute_type: str = "int8",
    ) -> None:
        from faster_whisper import WhisperModel  # heavy import, done lazily

        logger.info("Loading Whisper model '%s' (first run downloads it)...", model_size)
        self._model = WhisperModel(model_size, device="cpu", compute_type=compute_type)
        # Empty language -> let Whisper auto-detect.
        self._language = language or None

    def transcribe(self, audio: np.ndarray, samplerate: int) -> str:
        audio = np.asarray(audio, dtype=np.float32)
        if audio.ndim > 1:  # to mono
            audio = audio.mean(axis=1)
        if samplerate != 16000 and audio.size:  # Whisper expects 16 kHz
            from scipy.signal import resample

            audio = resample(audio, int(len(audio) * 16000 / samplerate))
            audio = audio.astype(np.float32)

        segments, _ = self._model.transcribe(
            audio, language=self._language, vad_filter=True
        )
        return "".join(segment.text for segment in segments).strip()
