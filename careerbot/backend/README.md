# CareerBot Backend (Relay Server)

StopWatch デバイスと OpenAI Realtime API（または将来の自前音声サーバー）を仲介するリレーサーバー。

## 役割

- デバイス認証（MVP: 共有トークン）
- WebSocket セッション管理 / heartbeat
- 音声チャンクの中継（device PCM16 ⇄ プロバイダ）
- 就職相談ペルソナ・3モードのプロンプト制御
- 会話履歴 / ユーザープロファイルの永続化
- ツール拡張口（模擬面接・回答添削・サマリ出力）

## 必要環境

- Node.js 20+（推奨 22+。`sqlite` ストレージは `node:sqlite` を使うため 22.5+ 推奨）

## セットアップ & 実行

```bash
npm install
cp .env.example .env
npm start          # http://localhost:8080, WebSocket: ws://localhost:8080/ws
```

### テスト

```bash
npm test
```

`node --test` を使用（追加の test ランナー不要）。`mock` プロバイダにより **API キー無しで E2E（会話成立）まで検証**できます。

## 設定（環境変数）

| 変数 | 既定 | 説明 |
|------|------|------|
| `PORT` | 8080 | リッスンポート |
| `DEVICE_TOKENS` | `cb-dev-token` | 許可するデバイストークン（カンマ区切り。空=開発用に全許可） |
| `VOICE_PROVIDER` | `mock` | `mock` または `openai` |
| `OPENAI_API_KEY` | – | `openai` 利用時に必須 |
| `OPENAI_REALTIME_MODEL` | `gpt-4o-realtime-preview` | Realtime モデル |
| `OPENAI_VOICE` | `alloy` | 出力音声 |
| `AUDIO_SAMPLE_RATE` | 16000 | 音声サンプルレート |
| `STORAGE` | `memory` | `memory` または `sqlite` |
| `SQLITE_PATH` | `./careerbot.db` | SQLite ファイルパス |

## アーキテクチャ

```
              ┌──────────────────────── backend ────────────────────────┐
device  ⇄ WS  │  gateway/wsGateway  ──▶ services/careerService (prompt)  │
(/ws)         │        │              ──▶ services/conversationService    │
              │        ▼                        │ (persist)               │
              │   realtime/voiceProvider ──▶ repositories/{memory,sqlite} │
              │     ├ mockProvider (offline)                              │
              │     └ openaiRealtimeProvider ⇄ OpenAI Realtime API        │
              └───────────────────────────────────────────────────────────┘
```

- **プロバイダ差し替え**: `realtime/voiceSession.js` の `VoiceSession` を実装し、`voiceProvider.js` の factory に分岐を追加するだけ。
- **永続化差し替え**: `repositories/*` は同一インターフェース（`MemoryRepo` / `SqliteRepo`）。

プロトコルの詳細は [`../docs/api.md`](../docs/api.md) を参照。
