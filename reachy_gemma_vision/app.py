"""Reachy Mini sees with Gemma 4 and talks back.

Pipeline (all local):
    Reachy Mini camera --> JPEG --> Gemma 4 (Ollama) --> text --> TTS --> speaker

Run it on the machine the robot is plugged into:

    python app.py                 # interactive conversation
    python app.py --once          # describe the scene once and exit
    python app.py --question "机の上に何がある?"

No robot/Ollama at hand? Try the offline demo, which mocks the camera,
Gemma (via a fake Ollama client) and the speaker so you can watch the
conversation loop run in the terminal:

    python app.py --demo
"""

from __future__ import annotations

import argparse
import logging
import sys

from config import Config

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
        "--tts-backend", default=cfg.tts_backend,
        choices=["voicevox", "macos", "piper", "pyttsx3"],
    )
    parser.add_argument(
        "--voicevox-speaker", type=int, default=cfg.voicevox_speaker,
        help="VOICEVOX speaker id (3=ずんだもん, 2=四国めたん, ...).",
    )
    parser.add_argument("--voicevox-host", default=cfg.voicevox_host, help="VOICEVOX URL.")
    parser.add_argument("--macos-voice", default=cfg.macos_voice, help="macOS `say` voice.")
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
    parser.add_argument(
        "--demo", action="store_true",
        help="Offline demo with mocked camera/Gemma/speaker (no hardware needed).",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging.")
    return parser.parse_args()


def build_components(args):
    """Create (chat, tts, robot_cm). Real implementations, or demo fakes."""
    if args.demo:
        from demo_fakes import build_demo_components

        return build_demo_components(args)

    # Real implementations — imported lazily so the demo (and --help) don't
    # require the heavy/optional dependencies to be installed.
    from gemma_client import GemmaVisionChat
    from robot import ReachyRobot
    from tts import build_tts

    chat = GemmaVisionChat(args.ollama_host, args.model, args.language)
    tts = build_tts(
        args.tts_backend,
        piper_model=args.piper_model,
        macos_voice=args.macos_voice,
        voicevox_host=args.voicevox_host,
        voicevox_speaker=args.voicevox_speaker,
    )
    robot_cm = ReachyRobot(args.media_backend, args.jpeg_quality)
    return chat, tts, robot_cm


def output_audio(robot, args, samples, samplerate, index: int) -> None:
    if args.audio_output == "file":
        import soundfile as sf

        path = f"answer_{index:02d}.wav"
        sf.write(path, samples, samplerate)
        print(f"  (saved speech to {path})")
    else:
        robot.speak(samples, samplerate)


def describe_and_speak(robot, chat, tts, args, user_text, is_japanese) -> None:
    """Capture a frame, ask Gemma about it, print and speak the answer."""
    print("📷 撮影中..." if is_japanese else "📷 Capturing...", flush=True)
    jpeg = robot.capture_jpeg()

    print(
        "🧠 Gemma 4 が解析中（初回はモデル読み込みで時間がかかります）..."
        if is_japanese
        else "🧠 Gemma 4 is analyzing (first run loads the model, please wait)...",
        flush=True,
    )
    print("\nReachy> ", end="", flush=True)
    answer = chat.describe(jpeg, user_text or None)  # streams to stdout
    print("\n", flush=True)

    print("🔊 発話中..." if is_japanese else "🔊 Speaking...", flush=True)
    samples, samplerate = tts.synthesize(answer)
    output_audio(robot, args, samples, samplerate, describe_and_speak.index)
    describe_and_speak.index += 1


describe_and_speak.index = 1  # type: ignore[attr-defined]


def run(args) -> int:
    is_japanese = args.language.lower().startswith("ja")
    chat, tts, robot_cm = build_components(args)

    prompt_label = (
        "\n質問 (Enter=もう一度見る / reset=記憶消去 / quit=終了) > "
        if is_japanese
        else "\nAsk (Enter=look again / reset / quit) > "
    )
    quit_words = {"quit", "exit", "q", "終了"}
    reset_words = {"reset", "リセット"}

    with robot_cm as robot:
        print(
            "✅ Reachy Mini + Gemma 4 起動しました。" if is_japanese
            else "✅ Reachy Mini + Gemma 4 ready.",
            flush=True,
        )

        # Single-shot modes: --once or a one-off --question.
        if args.once or args.question is not None:
            describe_and_speak(robot, chat, tts, args, args.question, is_japanese)
            return 0

        # Discard anything typed into the terminal while the robot was connecting
        # (so a stray "こんにちは" doesn't get eaten as the first question).
        _flush_stdin()

        # Greet by describing the scene right away, so it's conversational
        # without the user needing to know what to type first.
        describe_and_speak(robot, chat, tts, args, None, is_japanese)

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
                describe_and_speak(robot, chat, tts, args, user_text or None, is_japanese)
            except RuntimeError as exc:
                logger.error("%s", exc)

    print("さようなら！" if is_japanese else "Bye!")
    return 0


def _flush_stdin() -> None:
    try:
        import termios

        termios.tcflush(sys.stdin, termios.TCIFLUSH)
    except Exception:  # noqa: BLE001 - not POSIX / not a TTY; nothing to flush
        pass


def main() -> int:
    cfg = Config()
    args = parse_args(cfg)
    # Carry jpeg_quality through (not a CLI flag, but used by the robot wrapper).
    args.jpeg_quality = cfg.jpeg_quality
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    if not args.verbose:
        # Quiet the SDK's chatty INFO logs so the conversation is easy to read.
        logging.getLogger("reachy_mini").setLevel(logging.WARNING)
    try:
        return run(args)
    except Exception as exc:  # noqa: BLE001 - top-level guard for a CLI tool
        logger.error("Fatal error: %s", exc, exc_info=args.verbose)
        return 1


if __name__ == "__main__":
    sys.exit(main())
