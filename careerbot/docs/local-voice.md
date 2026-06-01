# ローカル音声パイプライン（Whisper + Gemma + VOICEVOX）

OpenAI を使わず、Mac 上のローカルサービスだけで音声対話する構成です。
仕様書の「自前サーバー経由の音声対話基盤」に相当し、`VOICE_PROVIDER=local` で有効化します。

```
device PCM16 ──▶ Whisper(STT) ──▶ Gemma(LLM/Ollama) ──▶ VOICEVOX(ずんだもん/TTS) ──▶ device
```

実装: `backend/src/realtime/localPipelineProvider.js`（音声変換は `audioUtils.js`）。
半二重（録音 → 確定 → STT→LLM→TTS → 再生）。各エンドポイントは環境変数で差し替え可能。

## 1. 各サービスを Mac で起動

### LLM: Gemma（Ollama）
```bash
brew install ollama
ollama serve                 # http://localhost:11434
ollama pull gemma3           # お持ちのモデル名に合わせる（例: gemma2, gemma3:4b 等）
```
Ollama は OpenAI 互換エンドポイント `/v1/chat/completions` を提供します。

> 「Gemma 4」は未リリースのため既定は `gemma3`。`LLM_MODEL` で実際のモデル名に変更してください。

### STT: Whisper（OpenAI 互換サーバー）
推奨は `faster-whisper-server`（OpenAI 互換 `/v1/audio/transcriptions`）:
```bash
pip install faster-whisper-server
faster-whisper-server         # 既定 http://localhost:8000
```
whisper.cpp の server を使う場合は OpenAI 互換モードで起動し、`STT_URL` を合わせてください。

### TTS: VOICEVOX（ずんだもん）
[VOICEVOX](https://voicevox.hiroshiba.jp/) アプリ、または VOICEVOX ENGINE を起動:
```bash
# ENGINE を Docker で
docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-latest
```
話者ID: ずんだもん(ノーマル)=3, あまあま=1, ツンツン=7 など。`VOICEVOX_SPEAKER` で変更。

## 2. バックエンドをローカルモードで起動

```bash
cd careerbot/backend
cp .env.example .env
# .env を編集:
#   VOICE_PROVIDER=local
#   LLM_MODEL=gemma3
#   VOICEVOX_SPEAKER=3
npm start
```

ヘルスチェックで `"provider":"local"` を確認:
```bash
curl localhost:8080/healthz
```

## 3. 設定一覧（環境変数）

| 変数 | 既定 | 説明 |
|------|------|------|
| `STT_URL` | `http://localhost:8000/v1/audio/transcriptions` | Whisper（OpenAI互換） |
| `STT_MODEL` | `whisper-1` | STT モデル名 |
| `LLM_URL` | `http://localhost:11434/v1/chat/completions` | Ollama（OpenAI互換） |
| `LLM_MODEL` | `gemma3` | LLM モデル名 |
| `LLM_API_KEY` | `ollama` | ローカルサーバーは通常無視 |
| `VOICEVOX_URL` | `http://localhost:50021` | VOICEVOX ENGINE |
| `VOICEVOX_SPEAKER` | `3` | 話者ID（ずんだもんノーマル） |
| `LOCAL_HISTORY_TURNS` | `12` | LLM に渡す履歴ターン数 |

## 4. 注意・調整ポイント

- **レイテンシ**: STT→LLM→TTS の直列実行。Gemma のサイズと Mac の性能で 2〜5 秒程度。
  小さめモデル（例 `gemma3:4b`）やストリーミング化（Phase 2）で短縮可能。
- **音声フォーマット**: 入力16k mono を WAV 化して Whisper へ。VOICEVOX 出力(24k)は
  デバイス用に 16k へリサンプリング（`audioUtils.resamplePcm16`）。
- **既存資産**: 過去に作った Whisper/VOICEVOX/Gemma の設定があれば、URL/モデル名を
  `.env` で合わせるだけで流用できます。
