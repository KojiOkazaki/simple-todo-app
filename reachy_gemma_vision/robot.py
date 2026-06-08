"""Thin wrapper around the Reachy Mini SDK for camera capture + speech output.

Camera frames come from ``mini.media.get_frame()`` (an ``(H, W, 3)`` uint8
array, OpenCV BGR order). Audio is streamed to the speaker with
``mini.media.push_audio_sample()``, which expects float32 mono/stereo samples
at the rate reported by ``get_output_audio_samplerate()`` and is non-blocking.
"""

from __future__ import annotations

import logging
import time

import cv2
import numpy as np
from scipy.signal import resample

from reachy_mini import ReachyMini

logger = logging.getLogger(__name__)

_CHUNK_SIZE = 1024  # samples per push, matching the SDK's sound_play example


class ReachyRobot:
    """Context manager that owns the ReachyMini connection and media devices."""

    def __init__(self, media_backend: str = "default", jpeg_quality: int = 90) -> None:
        self._media_backend = media_backend
        self._jpeg_quality = int(jpeg_quality)
        self._cm = None
        self._mini = None

    def __enter__(self) -> "ReachyRobot":
        logger.info("Connecting to Reachy Mini (backend=%s)...", self._media_backend)
        self._cm = ReachyMini(media_backend=self._media_backend)
        self._mini = self._cm.__enter__()
        # Acquire the speaker so we can push audio later.
        self._mini.media.start_playing()
        return self

    def __exit__(self, exc_type, exc, tb):
        try:
            if self._mini is not None:
                self._mini.media.stop_playing()
        finally:
            if self._cm is not None:
                self._cm.__exit__(exc_type, exc, tb)
        return False

    def capture_jpeg(self) -> bytes:
        """Grab the current camera frame and JPEG-encode it for Gemma.

        The GStreamer camera may need a moment after start-up before the first
        frame is available, so retry briefly instead of failing immediately.
        """
        frame = None
        for _ in range(50):  # ~5s of warm-up at 0.1s intervals
            frame = self._mini.media.get_frame()
            if frame is not None:
                break
            time.sleep(0.1)
        if frame is None:
            raise RuntimeError("Failed to grab a frame from the Reachy Mini camera.")
        frame = _downscale(frame, max_dim=1024)  # smaller image -> faster Gemma
        ok, buffer = cv2.imencode(
            ".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), self._jpeg_quality]
        )
        if not ok:
            raise RuntimeError("Failed to JPEG-encode the camera frame.")
        return buffer.tobytes()

    def speak(self, samples: np.ndarray, samplerate: int) -> None:
        """Play mono float32 ``samples`` through the robot speaker (blocking)."""
        out_rate = self._mini.media.get_output_audio_samplerate()
        samples = _prepare_samples(samples, samplerate, out_rate)
        if samples.size == 0:
            return

        for start in range(0, len(samples), _CHUNK_SIZE):
            self._mini.media.push_audio_sample(samples[start : start + _CHUNK_SIZE])

        # push_audio_sample is non-blocking, so wait for playback to finish.
        time.sleep(len(samples) / out_rate + 0.3)


def _downscale(frame: np.ndarray, max_dim: int) -> np.ndarray:
    height, width = frame.shape[:2]
    longest = max(height, width)
    if longest <= max_dim:
        return frame
    scale = max_dim / longest
    new_size = (int(width * scale), int(height * scale))
    return cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)


def _prepare_samples(samples: np.ndarray, samplerate: int, out_rate: int) -> np.ndarray:
    samples = np.asarray(samples, dtype=np.float32)
    if samples.ndim > 1:  # collapse to mono
        samples = samples.mean(axis=1)
    if samplerate != out_rate and samples.size:
        samples = resample(samples, int(len(samples) * out_rate / samplerate))
    # Guard against clipping when the synthesizer returns hot levels.
    peak = float(np.max(np.abs(samples))) if samples.size else 0.0
    if peak > 1.0:
        samples = samples / peak
    return samples.astype(np.float32)
