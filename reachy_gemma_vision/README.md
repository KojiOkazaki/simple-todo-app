# Reachy Mini × Gemma 4 ビジョン会話

Reachy Mini に接続されたカメラの映像を、**ローカルで動く Gemma 4**（Google のマルチモーダル・オープンモデル）で解析し、見えているものを**会話形式で Reachy Mini 本体のスピーカーから音声発話**するアプリです。クラウドは一切使わず、すべてローカル（オフライン）で完結します。

```
Reachy Mini カメラ ──▶ JPEG ──▶ Gemma 4 (Ollama) ──▶ テキスト ──▶ TTS ──▶ Reachy スピーカー
```

> **重要:** このアプリは Reachy Mini が USB 接続された実機マシン上で実行してください。カメラ取得と音声再生は Reachy Mini SDK 経由で行います。

## 構成要素

| 役割 | 使用技術 |
|------|----------|
| カメラ映像取得 | `reachy_mini` SDK (`mini.media.get_frame()`) |
| 画像認識・説明生成 | ローカル Gemma 4（[Ollama](https://ollama.com) 経由） |
| 音声合成 (TTS) | Piper（推奨 / 日本語対応）または pyttsx3（フォールバック） |
| 音声発話 | `reachy_mini` SDK (`mini.media.push_audio_sample()`) |

## セットアップ

### 1. Ollama と Gemma 4

Ollama 0.22 以降をインストールし、マルチモーダルの Gemma 4 を取得します。

```bash
# https://ollama.com からインストール後
ollama pull gemma4:e4b      # 軽量・省メモリ（既定）。16GB RAM クラスでも動作
# 他の選択肢: gemma4:12b / gemma4:26b / gemma4:31b （高精度・高メモリ）
ollama serve                # 通常はインストール時に常駐化されます
```

Gemma 4 は画像をそのまま入力できるマルチモーダルモデルなので、別途ビジョン用エンコーダは不要です。

### 2. Reachy Mini SDK

公式手順に従って `reachy_mini` パッケージをインストールしてください（例: `pip install reachy-mini`）。

### 3. Python 依存パッケージ

```bash
cd reachy_gemma_vision
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 4. TTS（音声合成）

**Piper（推奨）** — 高品質でローカル動作、日本語音声あり。

```bash
pip install piper-tts
# 日本語の音声モデル(.onnx + .onnx.json)をダウンロード
#   https://huggingface.co/rhasspy/piper-voices （ja_JP/ 配下）
export PIPER_MODEL=/path/to/ja_JP-xxxx-medium.onnx
```

Piper が未設定・未導入の場合は、自動的に **pyttsx3**（モデル不要のオフライン TTS）にフォールバックします（品質は劣り、日本語はシステム音声に依存）。

## 使い方

```bash
# 対話モード: Enter で「今何が見える?」、質問を入力すると追加で尋ねられます
python app.py

# 1回だけシーンを説明して終了
python app.py --once

# シーンについて1つだけ質問
python app.py --question "机の上に何がありますか？"

# スピーカーが無い環境でのテスト（音声を answer_NN.wav に保存）
python app.py --audio-output file --once
```

対話モードのコマンド:

- （空 Enter）… 現在の映像を説明
- 任意のテキスト … その映像についての質問（会話履歴は保持されます）
- `reset` … 会話の記憶をリセット
- `quit` … 終了

## 設定（環境変数）

| 変数 | 既定値 | 説明 |
|------|--------|------|
| `GEMMA_MODEL` | `gemma4:e4b` | 使用する Gemma 4 の Ollama タグ |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama サーバ URL |
| `REACHY_LANG` | `ja` | 出力言語（`ja` / `en`） |
| `TTS_BACKEND` | `piper` | `piper` または `pyttsx3` |
| `PIPER_MODEL` | （空） | Piper 音声モデル(.onnx)のパス |
| `AUDIO_OUTPUT` | `reachy` | `reachy`（実機発話）/ `file`（WAV保存） |
| `REACHY_MEDIA_BACKEND` | `default` | Reachy のメディアバックエンド |

CLI フラグ（`--model` など）は環境変数より優先されます。

## ファイル構成

| ファイル | 役割 |
|----------|------|
| `app.py` | エントリポイント・会話ループ |
| `config.py` | 設定（環境変数の読み込み） |
| `gemma_client.py` | Ollama 経由の Gemma 4 マルチモーダル会話 |
| `robot.py` | Reachy Mini のカメラ取得・スピーカー発話ラッパ |
| `tts.py` | Piper / pyttsx3 の音声合成 |

## 仕組みのメモ

- カメラフレームは `(H, W, 3)` の uint8（OpenCV の BGR）。`cv2.imencode` で JPEG 化して Gemma 4 に渡します。
- 会話履歴は保持しつつ、画像は最新ターンのみに残してコンテキストを節約しています。
- スピーカー出力は 16kHz・float32・モノラル。TTS の出力サンプリングレートが異なる場合は `robot.py` 側で自動リサンプリングします。`push_audio_sample()` は非ブロッキングなので、再生完了まで待機します。
