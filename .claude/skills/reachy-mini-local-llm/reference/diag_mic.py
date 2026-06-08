"""Check a microphone (Reachy SDK mic, or any input device via sounddevice).

Records ~5 seconds, prints a live level meter, saves mic_test.wav, reports the
peak level, and suggests a VAD threshold.

    python diag_mic.py              # Reachy Mini mic via the SDK
    python diag_mic.py --sd         # default input (e.g. MacBook mic) via sounddevice
    python diag_mic.py --sd --device Reachy   # Reachy mic via sounddevice
    python diag_mic.py --list       # list sounddevice input devices
"""

from __future__ import annotations

import argparse
import time

import numpy as np
import soundfile as sf


def _meter(rms: float) -> str:
    return "#" * min(int(rms * 300), 60)


def record_reachy(seconds: float):
    from reachy_mini import ReachyMini

    with ReachyMini(media_backend="default") as mini:
        mini.media.start_recording()
        try:
            rate = mini.media.get_input_audio_samplerate()
            print(f"入力サンプルレート: {rate} Hz（Reachy SDK）")
            print("▶ これから5秒間、普通の声で話してください...\n")
            collected, peak, start = [], 0.0, time.time()
            while time.time() - start < seconds:
                sample = mini.media.get_audio_sample()
                if sample is None:
                    continue
                mono = sample.mean(axis=1) if sample.ndim > 1 else np.asarray(sample)
                mono = mono.astype(np.float32)
                if not mono.size:
                    continue
                rms = float(np.sqrt(np.mean(mono ** 2)))
                peak = max(peak, rms)
                print(f"RMS={rms:.4f} |{_meter(rms)}", flush=True)
                collected.append(mono)
        finally:
            mini.media.stop_recording()
    audio = np.concatenate(collected) if collected else np.zeros(1, np.float32)
    return audio, rate, peak


def record_sounddevice(seconds: float, device_match: str):
    import sounddevice as sd

    device = None
    if device_match:
        for index, info in enumerate(sd.query_devices()):
            if info.get("max_input_channels", 0) > 0 and device_match.lower() in info["name"].lower():
                device = index
                print(f"入力デバイス: {info['name']}")
                break
    rate = 16000
    print(f"入力サンプルレート: {rate} Hz（sounddevice）")
    print("▶ これから5秒間、普通の声で話してください...\n")
    recording = sd.rec(int(seconds * rate), samplerate=rate, channels=1,
                       dtype="float32", device=device)
    start, peak = time.time(), 0.0
    while time.time() - start < seconds:
        time.sleep(0.1)
        idx = int((time.time() - start) * rate)
        window = recording[max(0, idx - rate // 10):idx, 0]
        rms = float(np.sqrt(np.mean(window ** 2))) if window.size else 0.0
        peak = max(peak, rms)
        print(f"RMS={rms:.4f} |{_meter(rms)}", flush=True)
    sd.wait()
    return recording[:, 0].astype(np.float32), rate, peak


def main() -> int:
    parser = argparse.ArgumentParser(description="Microphone diagnostic.")
    parser.add_argument("--sd", action="store_true", help="Use sounddevice instead of the Reachy SDK.")
    parser.add_argument("--device", default="", help="Input device name substring (with --sd).")
    parser.add_argument("--list", action="store_true", help="List sounddevice input devices and exit.")
    args = parser.parse_args()

    if args.list:
        import sounddevice as sd

        for index, info in enumerate(sd.query_devices()):
            if info.get("max_input_channels", 0) > 0:
                print(f"[{index}] {info['name']} (in={info['max_input_channels']})")
        return 0

    if args.sd:
        audio, rate, peak = record_sounddevice(5.0, args.device)
    else:
        audio, rate, peak = record_reachy(5.0)

    sf.write("mic_test.wav", audio, rate)
    print(f"\n録音長: {len(audio) / rate:.1f}s  ピークRMS: {peak:.4f}")
    print("mic_test.wav を保存しました（再生して自分の声が入っているか確認してください）。")
    if peak < 0.005:
        print("⚠️ レベルがほぼゼロ。マイク権限未許可、またはこの経路では取得できていません。")
    else:
        print(f"✅ マイク取得OK。推奨 VAD_THRESHOLD ≈ {peak * 0.3:.4f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
