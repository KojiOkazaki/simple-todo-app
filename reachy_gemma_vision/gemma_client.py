"""Conversational vision client backed by a local Gemma 4 model via Ollama.

Talks to Ollama's HTTP API (``/api/chat``) directly with the standard library
— the same endpoint the working ``ollama run`` CLI uses — instead of the
``ollama`` Python package, which stalled on image requests on some setups.

Gemma 4 is natively multimodal, so we hand it the camera frame (as a base64
JPEG) together with the user's question and let it answer in natural language.
The conversation history is kept so follow-up questions keep their context.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import subprocess
import tempfile
import threading
import urllib.request
from typing import Any, Dict, Iterator, List, Optional

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_JA = (
    "あなたは卓上ロボット『Reachy Mini』です。カメラで周りを見ることもできます。"
    "ユーザーと自然な日本語で会話する、親しみやすい相棒として振る舞ってください。"
    "最優先は『ユーザーが今言ったこと』に普通に・自然に応答することです。"
    "雑談には雑談で、相談には共感して返します。"
    "画像が一緒に渡されることがありますが、それは参考情報にすぎません。"
    "見た目について聞かれたとき（『何が見える』『これ何』『誰』『何色』など）"
    "だけ、その画像の内容に触れてください。"
    "聞かれてもいないのにカメラの映像をいちいち実況・説明しないこと。"
    "自分が何者か聞かれたら『Reachy Mini という小さなロボット』だと答えます。"
    "返答は短く（1〜2文）、音声で読み上げるので記号や箇条書きは使わず、"
    "温かい話し言葉で。分からないことは正直に言ってください。"
)

SYSTEM_PROMPT_EN = (
    "You are a small desktop robot called 'Reachy Mini' that can also see "
    "through a camera. Be a friendly companion who chats naturally. Your top "
    "priority is to respond naturally to what the user just said: chat back to "
    "small talk, empathize with worries. An image may be attached, but it is "
    "only reference. Only talk about what you see when actually asked about it "
    "(e.g. 'what do you see', 'what is this', 'who is that', 'what colour'). Do "
    "not narrate the camera view unprompted. If asked who you are, say you are "
    "a little robot called Reachy Mini. Keep replies short (1-2 sentences), "
    "spoken-style, no symbols or bullet points. Be honest when unsure."
)

DEFAULT_QUESTION_JA = "今、カメラに何が見えますか？"
DEFAULT_QUESTION_EN = "What do you see in the camera right now?"


def _heartbeat(stop: threading.Event) -> None:
    """Print a dot every couple of seconds until ``stop`` is set."""
    while not stop.wait(2.0):
        print(".", end="", flush=True)


class GemmaVisionChat:
    """Stateful multimodal chat with Gemma 4 on a local Ollama server (HTTP)."""

    def __init__(
        self,
        host: str,
        model: str,
        language: str = "ja",
        think: Optional[bool] = None,
        transport: str = "http",
    ) -> None:
        self._chat_url = host.rstrip("/") + "/api/chat"
        self._model = model
        # "http" -> Ollama /api/chat. "cli" -> shell out to `ollama run`
        # (the path proven to work for images on setups where HTTP stalls).
        self._transport = transport
        # think=None -> don't send the param (mirror `ollama run`, which works).
        # NOTE: sending think=False with an image hangs Ollama 0.30.x for Gemma 4,
        # so we leave thinking at the server default unless explicitly overridden.
        self._think = think
        self._is_japanese = language.lower().startswith("ja")
        system = SYSTEM_PROMPT_JA if self._is_japanese else SYSTEM_PROMPT_EN
        self._system_message: Dict[str, Any] = {"role": "system", "content": system}
        self._messages: List[Dict[str, Any]] = [dict(self._system_message)]

    @property
    def default_question(self) -> str:
        return DEFAULT_QUESTION_JA if self._is_japanese else DEFAULT_QUESTION_EN

    def describe(
        self, image_jpeg: bytes, user_text: Optional[str] = None, stream: bool = True
    ) -> str:
        """Back-compat helper: respond with an image attached."""
        return self.respond(user_text, image_jpeg, stream)

    def respond(
        self,
        user_text: Optional[str] = None,
        image_jpeg: Optional[bytes] = None,
        stream: bool = True,
    ) -> str:
        """Reply to the user, optionally with the current frame attached.

        For chit-chat, call without an image so the model just converses; pass
        ``image_jpeg`` only when the user asks about what's visible.
        """
        prompt = (user_text or "").strip() or self.default_question

        if self._transport == "cli":
            return self._describe_cli(image_jpeg, prompt, stream)

        # Keep only the newest image in history to bound the context size.
        self._strip_old_images()
        message: Dict[str, Any] = {"role": "user", "content": prompt}
        if image_jpeg is not None:
            message["images"] = [base64.b64encode(image_jpeg).decode("ascii")]
        self._messages.append(message)

        logger.debug("Querying %s with prompt: %s", self._model, prompt)
        parts: List[str] = []
        answer_started = False
        stop_beat = threading.Event()
        if stream:
            threading.Thread(target=_heartbeat, args=(stop_beat,), daemon=True).start()
        try:
            for obj in self._chat_stream():
                piece = (obj.get("message", {}) or {}).get("content") or ""
                if not piece:
                    continue
                if stream and not answer_started:
                    stop_beat.set()
                    print("\nReachy> ", end="", flush=True)
                    answer_started = True
                if stream:
                    print(piece, end="", flush=True)
                parts.append(piece)
        finally:
            stop_beat.set()
        if stream and answer_started:
            print(flush=True)

        answer = "".join(parts).strip()
        if not answer:
            answer = (
                "うまく説明できませんでした。"
                if self._is_japanese
                else "Sorry, I couldn't describe that."
            )

        self._messages.append({"role": "assistant", "content": answer})
        return answer

    def _describe_cli(self, image_jpeg, prompt: str, stream: bool) -> str:
        """Respond via `ollama run` (subprocess) — the path that works for
        images when the HTTP API stalls. Single-turn (no chat history)."""
        img_path = None
        if image_jpeg is not None:
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                tmp.write(image_jpeg)
                img_path = tmp.name

        # `ollama run` detects the image path embedded in the prompt text.
        full_prompt = f"{self._system_message['content']}\n\n{prompt}"
        if img_path:
            full_prompt += f"\n{img_path}"

        stop_beat = threading.Event()
        if stream:
            threading.Thread(target=_heartbeat, args=(stop_beat,), daemon=True).start()
        try:
            proc = subprocess.run(
                ["ollama", "run", self._model, full_prompt],
                capture_output=True, text=True, timeout=300,
            )
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError("ollama run timed out (300s).") from exc
        finally:
            stop_beat.set()
            if img_path:
                try:
                    os.unlink(img_path)
                except OSError:
                    pass

        if proc.returncode != 0:
            raise RuntimeError(f"ollama run failed: {proc.stderr.strip()}")

        answer = proc.stdout.strip() or (
            "うまく説明できませんでした。"
            if self._is_japanese
            else "Sorry, I couldn't describe that."
        )
        if stream:
            print(f"\nReachy> {answer}", flush=True)
        return answer

    def _chat_stream(self) -> Iterator[Dict[str, Any]]:
        """Stream Ollama's /api/chat response as decoded JSON objects."""
        payload: Dict[str, Any] = {
            "model": self._model,
            "messages": self._messages,
            "stream": True,
            "keep_alive": "30m",  # keep the model resident between calls
        }
        if self._think is not None:
            payload["think"] = self._think

        request = urllib.request.Request(
            self._chat_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=300) as response:
            for raw_line in response:  # NDJSON: one JSON object per line
                raw_line = raw_line.strip()
                if not raw_line:
                    continue
                obj = json.loads(raw_line)
                if obj.get("error"):
                    raise RuntimeError(f"Ollama error: {obj['error']}")
                yield obj
                if obj.get("done"):
                    break

    def reset(self) -> None:
        """Forget the conversation, keeping only the system prompt."""
        self._messages = [dict(self._system_message)]

    def _strip_old_images(self) -> None:
        for message in self._messages:
            message.pop("images", None)
