"""Standalone check: does the local Gemma 4 (Ollama) actually do vision?

No robot needed. Generates a simple test image (a red circle + the word
"HELLO" on white), sends it to Ollama's HTTP /api/chat (the same endpoint the
`ollama run` CLI uses), and prints the reply with timing.

    python diag_vision.py
    python diag_vision.py --model gemma4:e2b
"""

from __future__ import annotations

import argparse
import base64
import json
import threading
import time
import urllib.request

import cv2
import numpy as np

from config import Config


def _heartbeat(stop: threading.Event) -> None:
    while not stop.wait(2.0):
        print(".", end="", flush=True)


def make_test_image() -> str:
    img = np.full((480, 640, 3), 255, dtype=np.uint8)  # white background
    cv2.circle(img, (320, 200), 110, (0, 0, 255), -1)  # red filled circle (BGR)
    cv2.putText(img, "HELLO", (150, 430), cv2.FONT_HERSHEY_SIMPLEX, 3, (0, 0, 0), 6)
    cv2.imwrite("diag_test.jpg", img)  # so you can open and see what was sent
    ok, buffer = cv2.imencode(".jpg", img)
    if not ok:
        raise RuntimeError("Failed to encode the test image.")
    return base64.b64encode(buffer.tobytes()).decode("ascii")


def stream_chat(chat_url, model, image_b64, prompt):
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt, "images": [image_b64]}],
        "stream": True,
        "keep_alive": "30m",
        # NOTE: do NOT send think=False here — that hangs Ollama 0.30.x for
        # Gemma 4 + image. Leave thinking at the server default (mirrors the CLI).
    }
    request = urllib.request.Request(
        chat_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=300) as response:
        for raw in response:
            raw = raw.strip()
            if not raw:
                continue
            obj = json.loads(raw)
            if obj.get("error"):
                raise RuntimeError(f"Ollama error: {obj['error']}")
            yield obj
            if obj.get("done"):
                break


def main() -> int:
    cfg = Config()
    parser = argparse.ArgumentParser(description="Test Ollama Gemma 4 vision.")
    parser.add_argument("--model", default=cfg.model)
    parser.add_argument("--ollama-host", default=cfg.ollama_host)
    args = parser.parse_args()

    image_b64 = make_test_image()
    chat_url = args.ollama_host.rstrip("/") + "/api/chat"
    print(f"model={args.model}  url={chat_url}")
    print("test image: 白背景に赤い丸と『HELLO』の文字 (diag_test.jpg に保存)")
    print("画像を送信中... 初回はモデル読み込みで時間がかかります。")

    prompt = "この画像には何が写っていますか？色や文字も含めて日本語で説明してください。"
    start = time.time()
    first_token_at = None
    parts = []
    stop_beat = threading.Event()
    threading.Thread(target=_heartbeat, args=(stop_beat,), daemon=True).start()
    try:
        for obj in stream_chat(chat_url, args.model, image_b64, prompt):
            piece = (obj.get("message", {}) or {}).get("content") or ""
            if not piece:
                continue
            if first_token_at is None:
                first_token_at = time.time()
                stop_beat.set()
                print(f"\n[最初のトークンまで {first_token_at - start:.1f}s]")
                print("回答> ", end="", flush=True)
            print(piece, end="", flush=True)
            parts.append(piece)
    finally:
        stop_beat.set()

    elapsed = time.time() - start
    answer = "".join(parts).strip()
    print(f"\n\n[完了: {elapsed:.1f}s / 文字数 {len(answer)}]")
    if not answer:
        print("⚠️ 応答が空でした。モデルが画像非対応か、ロードに失敗した可能性があります。")
        return 1
    if any(k in answer for k in ("赤", "丸", "円", "HELLO", "ハロー", "文字")):
        print("✅ 画像の内容（赤い丸/HELLO等）に言及 → マルチモーダル動作OK。")
    else:
        print("△ 画像の内容に触れていないようです。応答内容を確認してください。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
