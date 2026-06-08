"""Check the Reachy Mini microphone.

Records ~5 seconds, prints a live level meter, saves mic_test.wav (so you can
play it back), reports the peak level, and suggests a VAD threshold.

    python diag_mic.py
"""

from __future__ import annotations

import time

import numpy as np
import soundfile as sf
from reachy_mini import ReachyMini


def main() -> int:
    with ReachyMini(media_backend="default") as mini:
        mini.media.start_recording()
        try:
            rate = mini.media.get_input_audio_samplerate()
            print(f"入力サンプルレート: {rate} Hz")
            print("▶ これから5秒間、普通の声で話してください...\n")

            collected = []
            peak = 0.0
            start = time.time()
            while time.time() - start < 5.0:
                sample = mini.media.get_audio_sample()
                if sample is None:
                    continue
                mono = sample.mean(axis=1) if sample.ndim > 1 else np.asarray(sample)
                mono = mono.astype(np.float32)
                if not mono.size:
                    continue
                rms = float(np.sqrt(np.mean(mono ** 2)))
                peak = max(peak, rms)
                bar = "#" * min(int(rms * 300), 60)
                print(f"RMS={rms:.4f} |{bar}", flush=True)
                collected.append(mono)
        finally:
            mini.media.stop_recording()

        audio = np.concatenate(collected) if collected else np.zeros(1, np.float32)
        sf.write("mic_test.wav", audio, rate)
        print(f"\n録音長: {len(audio) / rate:.1f}s  ピークRMS: {peak:.4f}")
        print("mic_test.wav を保存しました（再生して自分の声が入っているか確認してください）。")
        if peak < 0.005:
            print("⚠️ レベルがほぼゼロです。マイクがキャプチャできていない可能性が高いです。")
        else:
            print(f"推奨 VAD_THRESHOLD ≈ {peak * 0.3:.4f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
