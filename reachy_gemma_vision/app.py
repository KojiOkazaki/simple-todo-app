"""Reachy Mini sees with Gemma 4 and talks back.

Pipeline (all local):
    Reachy Mini camera --> JPEG --> Gemma 4 (Ollama) --> text --> TTS --> speaker

Run it on the machine the robot is plugged into:

    python app.py                 # interactive conversation
    python app.py --once          # describe the scene once and exit
    python app.py --question "机の上に何がある?"
"""

from __future__ import annotations

import argparse
import logging
import sys

import soundfile as sf

from config import Config
from gemma_client import GemmaVisionChat
from robot import ReachyRobot
from tts import build_tts

logger = logging.getLogger("reachy_gemma_vision")


def parse_args(cfg: Config) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Describe what Reachy Mini's camera sees using local Gemma 4, "
        "and speak the answer through the robot."
    )
    parser.add_argument("--model", default=cfg.model, help="Ollama model tag (Gemma 4).")
    parser.add_argument("--ollama-host", default=cfg.ollama_host, help="Ollama base URL.")
    parser.add_argument("--language", default=cfg.language, help='"ja" or "en".')
    parser.add_argument(
        "--tts-backend", default=cfg.tts_backend, choices=["piper", "pyttsx3"]
    )
    parser.add_argument("--piper-model", default=cfg.piper_model, help="Piper .onnx voice.")
    parser.add_argument(
        "--audio-output", default=cfg.audio_output, choices=["reachy", "file"],
        help='Where to send speech. "reachy" speaks through the robot; '
        '"file" writes answer_NN.wav (useful for testing without a speaker).',
    )
    parser.add_argument("--media-backend", default=cfg.media_backend)
    parser.add_argument(
        "--once", action="store_true", help="Describe the scene once, then exit."
    )
    parser.add_argument(
        "--question", default=None, help="A single question to ask about the scene."
    )
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging.")
    return parser.parse_args()


def output_audio(robot: ReachyRobot, args, samples, samplerate, index: int) -> None:
    if args.audio_output == "file":
        path = f"answer_{index:02d}.wav"
        sf.write(path, samples, samplerate)
        print(f"  (saved speech to {path})")
    else:
        robot.speak(samples, samplerate)


def run(args) -> int:
    is_japanese = args.language.lower().startswith("ja")
    tts = build_tts(args.tts_backend, args.piper_model)
    chat = GemmaVisionChat(args.ollama_host, args.model, args.language)

    prompt_label = (
        "\n質問 (Enter=「今何が見える?」 / reset=記憶消去 / quit=終了) > "
        if is_japanese
        else "\nAsk (Enter=describe / reset / quit) > "
    )
    quit_words = {"quit", "exit", "q", "終了"}
    reset_words = {"reset", "リセット"}

    with ReachyRobot(args.media_backend, args.jpeg_quality) as robot:
        print("Reachy Mini + Gemma 4 ready." if not is_japanese else "Reachy Mini + Gemma 4 起動しました。")

        index = 0
        # Single-shot modes: --once or a one-off --question.
        if args.once or args.question is not None:
            index += 1
            answer = chat.describe(robot.capture_jpeg(), args.question)
            print(f"\nReachy> {answer}")
            samples, samplerate = tts.synthesize(answer)
            output_audio(robot, args, samples, samplerate, index)
            return 0

        # Interactive conversation loop.
        while True:
            try:
                user_text = input(prompt_label).strip()
            except (EOFError, KeyboardInterrupt):
                print()
                break

            lowered = user_text.lower()
            if lowered in quit_words:
                break
            if lowered in reset_words:
                chat.reset()
                print("  (会話の記憶をリセットしました)" if is_japanese else "  (conversation reset)")
                continue

            try:
                jpeg = robot.capture_jpeg()
            except RuntimeError as exc:
                logger.error("%s", exc)
                continue

            answer = chat.describe(jpeg, user_text or None)
            print(f"\nReachy> {answer}")

            index += 1
            samples, samplerate = tts.synthesize(answer)
            output_audio(robot, args, samples, samplerate, index)

    print("さようなら！" if is_japanese else "Bye!")
    return 0


def main() -> int:
    cfg = Config()
    args = parse_args(cfg)
    # Carry jpeg_quality through (not a CLI flag, but used by the robot wrapper).
    args.jpeg_quality = cfg.jpeg_quality
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    try:
        return run(args)
    except Exception as exc:  # noqa: BLE001 - top-level guard for a CLI tool
        logger.error("Fatal error: %s", exc, exc_info=args.verbose)
        return 1


if __name__ == "__main__":
    sys.exit(main())
