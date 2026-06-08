"""Microphone capture via sounddevice (PortAudio).

A robust alternative to the Reachy SDK mic for voice input: records from the
system default input (e.g. the MacBook mic) or a device whose name matches a
substring (e.g. "Reachy"). Uses the same energy-based VAD as ReachyRobot, so
it plugs into the voice loop with an identical record_utterance() interface.
"""

from __future__ import annotations

import logging
import queue
import time

import numpy as np

logger = logging.getLogger(__name__)


class SoundDeviceMic:
    def __init__(self, device_match: str = "", samplerate: int = 16000) -> None:
        import sounddevice as sd  # imported lazily

        self._sd = sd
        self._rate = samplerate
        self._device = self._resolve_device(device_match)

    def _resolve_device(self, device_match: str):
        if not device_match:
            return None  # system default input
        match = device_match.lower()
        for index, info in enumerate(self._sd.query_devices()):
            if info.get("max_input_channels", 0) > 0 and match in info["name"].lower():
                logger.info("Using input device: %s", info["name"])
                return index
        logger.warning("No input device matched %r; using default.", device_match)
        return None

    def record_utterance(
        self,
        threshold: float = 0.01,
        max_seconds: float = 15.0,
        silence_seconds: float = 1.5,
        start_timeout: float = 10.0,
    ) -> tuple:
        chunks: "queue.Queue" = queue.Queue()

        def callback(indata, frames, time_info, status):  # noqa: ANN001
            chunks.put(indata.copy())

        blocksize = int(self._rate * 0.1)  # 100 ms blocks
        collected = []
        speaking = False
        silent_run = 0.0
        waited = 0.0
        peak = 0.0
        start = time.time()
        with self._sd.InputStream(
            samplerate=self._rate, channels=1, dtype="float32",
            device=self._device, blocksize=blocksize, callback=callback,
        ):
            while True:
                try:
                    block = chunks.get(timeout=1.0)
                except queue.Empty:
                    if time.time() - start >= max_seconds:
                        break
                    continue
                mono = block[:, 0]
                chunk_dur = len(mono) / self._rate
                rms = float(np.sqrt(np.mean(mono ** 2))) if mono.size else 0.0
                peak = max(peak, rms)

                if rms >= threshold:
                    speaking = True
                    silent_run = 0.0
                    collected.append(mono)
                elif speaking:
                    collected.append(mono)
                    silent_run += chunk_dur
                    if silent_run >= silence_seconds:
                        break
                else:
                    waited += chunk_dur
                    if waited >= start_timeout:
                        break
                if time.time() - start >= max_seconds:
                    break

        if not collected:
            logger.info(
                "No speech detected (mic peak RMS=%.4f, threshold=%.4f).", peak, threshold
            )
            return None, self._rate
        return np.concatenate(collected).astype(np.float32), self._rate
