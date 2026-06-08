"""Conversational vision client backed by a local Gemma 4 model via Ollama.

Gemma 4 is natively multimodal, so we hand it the camera frame (JPEG bytes)
together with the user's question and let it answer in natural language.
The conversation history is kept so the user can ask follow-up questions
("and what is to the left of it?") and Gemma keeps the context.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import ollama

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_JA = (
    "あなたはデスクトップロボット『Reachy Mini』の目と頭脳です。"
    "Reachy Mini のカメラに映っている映像を見て、そこに何が見えるかを"
    "日本語で、親しみやすい会話口調で説明してください。"
    "回答は簡潔に（2〜4文程度）。色・位置・数・人や物の様子など、"
    "具体的に分かることを述べ、断定できない場合は推測であると伝えてください。"
    "音声で読み上げられるため、箇条書きや記号は使わず自然な文章で答えてください。"
)

SYSTEM_PROMPT_EN = (
    "You are the eyes and brain of a desktop robot called 'Reachy Mini'. "
    "Look at the image from Reachy Mini's camera and describe what you see in "
    "a friendly, conversational tone. Keep answers concise (2-4 sentences), be "
    "concrete about colours, positions, counts and what people/objects are "
    "doing, and say when you are only guessing. Your reply is read aloud, so "
    "use natural sentences without bullet points or symbols."
)

DEFAULT_QUESTION_JA = "今、カメラに何が見えますか？"
DEFAULT_QUESTION_EN = "What do you see in the camera right now?"


class GemmaVisionChat:
    """Stateful multimodal chat with Gemma 4 running on a local Ollama server."""

    def __init__(self, host: str, model: str, language: str = "ja") -> None:
        self._client = ollama.Client(host=host)
        self._model = model
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
        """Send the current frame (+ optional question) to Gemma and return its reply.

        Streams the answer to stdout as it is generated (so a slow first call
        doesn't look frozen) and disables Gemma's "thinking" trace for speed.
        """
        prompt = (user_text or "").strip() or self.default_question

        # Keep only the newest image in the history to bound the context size:
        # older turns stay as text, which is enough to maintain the conversation.
        self._strip_old_images()
        self._messages.append(
            {"role": "user", "content": prompt, "images": [image_jpeg]}
        )

        logger.debug("Querying %s with prompt: %s", self._model, prompt)
        if stream:
            parts = []
            for chunk in self._chat(stream=True):
                piece = (chunk.get("message", {}) or {}).get("content", "")
                if piece:
                    print(piece, end="", flush=True)
                    parts.append(piece)
            answer = "".join(parts).strip()
        else:
            response = self._chat(stream=False)
            answer = (response.get("message", {}) or {}).get("content", "").strip()

        if not answer:
            answer = (
                "うまく説明できませんでした。"
                if self._is_japanese
                else "Sorry, I couldn't describe that."
            )

        self._messages.append({"role": "assistant", "content": answer})
        return answer

    def _chat(self, stream: bool):
        """Call Ollama with thinking disabled (falling back if unsupported)."""
        try:
            return self._client.chat(
                model=self._model, messages=self._messages, stream=stream, think=False
            )
        except TypeError:
            # Older ollama-python without the `think` parameter.
            return self._client.chat(
                model=self._model, messages=self._messages, stream=stream
            )

    def reset(self) -> None:
        """Forget the conversation, keeping only the system prompt."""
        self._messages = [dict(self._system_message)]

    def _strip_old_images(self) -> None:
        for message in self._messages:
            message.pop("images", None)
