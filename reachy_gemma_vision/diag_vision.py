"""Standalone check: does the local Gemma 4 (Ollama) actually do vision?

No robot needed. Generates a simple test image (a red circle + the word
"HELLO" on white), sends it to the configured Ollama model, and prints the
reply with timing. Use this to confirm multimodality and measure how long
the first (model-loading) image call takes.

    python diag_vision.py
    python diag_vision.py --model gemma4:e2b      # try a smaller/faster tag
"""

from __future__ import annotations

import argparse
import base64
import time

import cv2
import numpy as np
import ollama

from config import Config


def make_test_image() -> str:
    img = np.full((480, 640, 3), 255, dtype=np.uint8)  # white background
    cv2.circle(img, (320, 200), 110, (0, 0, 255), -1)  # red filled circle (BGR)
    cv2.putText(img, "HELLO", (150, 430), cv2.FONT_HERSHEY_SIMPLEX, 3, (0, 0, 0), 6)
    cv2.imwrite("diag_test.jpg", img)  # so you can open and see what was sent
    ok, buffer = cv2.imencode(".jpg", img)
    if not ok:
        raise RuntimeError("Failed to encode the test image.")
    return base64.b64encode(buffer.tobytes()).decode("ascii")


def chat_stream(client, model, messages):
    # Mirror `ollama run` (which works): don't force think off; let it stream.
    return client.chat(model=model, messages=messages, stream=True, keep_alive="30m")


def main() -> int:
    cfg = Config()
    parser = argparse.ArgumentParser(description="Test Ollama Gemma 4 vision.")
    parser.add_argument("--model", default=cfg.model)
    parser.add_argument("--ollama-host", default=cfg.ollama_host)
    args = parser.parse_args()

    image_b64 = make_test_image()
    print(f"model={args.model}  host={args.ollama_host}")
    print("test image: 白背景に赤い丸と『HELLO』の文字 (diag_test.jpg に保存)")
    print("画像を送信中... 初回はモデル読み込みで時間がかかります。")

    client = ollama.Client(host=args.ollama_host)
    messages = [
        {
            "role": "user",
            "content": "この画像には何が写っていますか？色や文字も含めて日本語で説明してください。",
            "images": [image_b64],
        }
    ]

    start = time.time()
    first_token_at = None
    parts = []
    for chunk in chat_stream(client, args.model, messages):
        piece = (chunk.get("message", {}) or {}).get("content") or ""
        if not piece:
            continue
        if first_token_at is None:
            first_token_at = time.time()
            print(f"\n[最初のトークンまで {first_token_at - start:.1f}s]")
            print("回答> ", end="", flush=True)
        print(piece, end="", flush=True)
        parts.append(piece)

    elapsed = time.time() - start
    answer = "".join(parts).strip()
    print(f"\n\n[完了: {elapsed:.1f}s / 文字数 {len(answer)}]")
    if not answer:
        print("⚠️ 応答が空でした。モデルが画像非対応か、ロードに失敗した可能性があります。")
        return 1
    if any(k in answer for k in ("赤", "丸", "円", "HELLO", "ハロー", "文字")):
        print("✅ 画像の内容（赤い丸/HELLO等）に言及しています → マルチモーダル動作OK。")
    else:
        print("△ 画像の内容に触れていないようです。応答内容を確認してください。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
