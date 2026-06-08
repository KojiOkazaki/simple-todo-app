"""Offline demo doubles for the camera, Gemma 4 (Ollama) and the speaker.

The point of the demo is to let you watch the *real* conversation loop run
without a Reachy Mini, an Ollama server, or any heavy dependencies. To keep
the demonstration faithful, we inject a fake ``ollama`` module into
``sys.modules`` so the genuine :class:`gemma_client.GemmaVisionChat` (system
prompt, history handling, image-stripping) executes for real — only the model
call itself is faked.
"""

from __future__ import annotations

import sys
import time
import types

# A few canned scenes the fake camera cycles through. Each "frame" is just the
# scene id encoded as bytes; the fake Gemma reads it back to craft a reply.
_SCENES = [
    ("desk", "木目の机の上に、白いコーヒーカップと開いたノートパソコン、黒い眼鏡が置かれています"),
    ("plant", "窓際の棚に、緑の葉が茂った観葉植物の鉢が置かれ、やわらかい自然光が差し込んでいます"),
    ("person", "正面に紺色のパーカーを着た人がいて、こちらに向かって笑顔で手を振っています"),
]


def _install_fake_ollama() -> None:
    """Register a minimal fake ``ollama`` module before gemma_client imports it."""
    if "ollama" in sys.modules:
        return

    module = types.ModuleType("ollama")

    class _FakeClient:
        def __init__(self, host=None):
            self.host = host

        def chat(self, model, messages, stream=False, think=None, **kwargs):
            # Pull the freshest scene from the attached image, and the question.
            scene_desc = "目の前の様子"
            user_text = ""
            for message in messages:
                if message.get("role") != "user":
                    continue
                user_text = message.get("content", "")
                images = message.get("images") or []
                if images:
                    scene_desc = _decode_scene(images[0])

            reply = _fake_gemma_reply(scene_desc, user_text)
            if stream:
                return (
                    {"message": {"role": "assistant", "content": piece}}
                    for piece in _chunks(reply)
                )
            return {"message": {"role": "assistant", "content": reply}}

    module.Client = _FakeClient
    sys.modules["ollama"] = module


def _chunks(text: str, size: int = 8):
    for i in range(0, len(text), size):
        yield text[i : i + size]


def _decode_scene(image) -> str:
    try:
        if isinstance(image, str):  # base64 string (as the real client sends)
            import base64

            tag = base64.b64decode(image).decode("utf-8")
        else:
            tag = bytes(image).decode("utf-8")
    except Exception:  # noqa: BLE001
        return "目の前の様子"
    for scene_id, desc in _SCENES:
        if tag.endswith(scene_id):
            return desc
    return "目の前の様子"


def _fake_gemma_reply(scene_desc: str, user_text: str) -> str:
    """Very small stand-in for Gemma 4's multimodal answer (Japanese)."""
    text = (user_text or "").strip()
    if "左" in text:
        return f"画面の左側を見ると、{scene_desc}。左寄りの物が少し近くに見えますね。"
    if "色" in text:
        return f"色合いについてですが、{scene_desc}。全体的に落ち着いた色味です。"
    if "人" in text or "誰" in text:
        return f"人がいるか確認しますね。{scene_desc}。"
    return f"はい、{scene_desc}。そんな様子が見えていますよ。"


class FakeRobot:
    """Stands in for ReachyRobot: a cycling synthetic camera + a console speaker."""

    def __init__(self):
        self._i = 0

    def __enter__(self):
        print("[demo] 仮想 Reachy Mini に接続しました（カメラ/スピーカーはモック）")
        return self

    def __exit__(self, *exc):
        print("[demo] 仮想 Reachy Mini を切断しました")
        return False

    def capture_jpeg(self) -> bytes:
        scene_id, desc = _SCENES[self._i % len(_SCENES)]
        self._i += 1
        print(f"[demo] 📷 カメラ取得: 仮想シーン「{desc}」")
        return f"SCENE::{scene_id}".encode("utf-8")

    def speak(self, samples, samplerate: int) -> None:
        duration = len(samples) / samplerate if samplerate else 0.0
        print(f"[demo] 🔊 Reachy のスピーカーで発話中... ({duration:.1f}s 相当)")
        time.sleep(min(duration, 0.4))  # brief pause so the demo feels real


class FakeTTS:
    """Stands in for a TTS engine: returns a dummy 16kHz buffer sized by text."""

    def synthesize(self, text: str):
        samplerate = 16000
        n_samples = int(len(text) * 0.09 * samplerate)  # ~0.09s per character
        print(f"[demo] 🗣️  音声合成: {len(text)}文字 -> {n_samples} samples @ {samplerate}Hz")
        return [0.0] * n_samples, samplerate


def build_demo_components(args):
    _install_fake_ollama()
    from gemma_client import GemmaVisionChat  # real class, fake ollama underneath

    chat = GemmaVisionChat(args.ollama_host, args.model, args.language)
    return chat, FakeTTS(), FakeRobot()
