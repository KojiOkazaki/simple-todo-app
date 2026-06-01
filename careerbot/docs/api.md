# CareerBot 通信プロトコル（デバイス ↔ サーバー）

トランスポート: **WebSocket**（エンドポイント `ws://<host>:<port>/ws`）

- 制御メッセージ: **JSON テキストフレーム**
- 音声: **バイナリフレーム**（生 PCM16 チャンク）。直前の `audio_*_start` がフォーマットを宣言する。

サンプルレート/チャンネル/フォーマットは `auth_ok` と `audio_out_start` で明示される（MVP 既定: 16kHz / mono / pcm16）。

## ハンドシェイク & 認証

| 順 | 方向 | type | 内容 |
|----|------|------|------|
| 1 | D→S | `hello` | `device_id`, `firmware_version`, `device_token` |
| 2 | S→D | `auth_ok` | `session_id`, `audio`（sampleRate/channels/format） |
| – | S→D | `error` (`AUTH_FAILED`) | トークン不正時。接続クローズ |

`DEVICE_TOKENS` が空のときは開発用に任意トークンを許可。

## 状態遷移（S→D `state`）

`idle` → `listening` → `thinking` → `speaking` → `idle`（エラー時 `error`）。
ファームウェアの UI 状態と 1:1 対応。

## 1ターンのフロー（Push-to-talk）

```
D→S  { "type": "audio_in_start", "sample_rate": 16000, "channels": 1, "format": "pcm16" }
S→D  { "type": "state", "value": "listening" }
D→S  <binary PCM16 chunk> ...          # 録音中、複数フレーム
D→S  { "type": "audio_in_end" }
S→D  { "type": "state", "value": "thinking" }
S→D  { "type": "transcript", "role": "user", "text": "..." }
S→D  { "type": "transcript", "role": "assistant", "text": "..." }
S→D  { "type": "assistant_text", "text": "..." }       # 字幕（デルタ or 全文）
S→D  { "type": "state", "value": "speaking" }
S→D  { "type": "audio_out_start", "sample_rate": 16000, "channels": 1, "format": "pcm16" }
S→D  <binary PCM16 chunk> ...
S→D  { "type": "audio_out_end" }
S→D  { "type": "state", "value": "idle" }
```

## メッセージ一覧

### Device → Server

| type | フィールド | 説明 |
|------|-----------|------|
| `hello` | `device_id`, `firmware_version`, `device_token` | 接続開始・認証 |
| `audio_in_start` | `sample_rate`, `channels`, `format` | 録音開始宣言 |
| (binary) | – | PCM16 音声チャンク |
| `audio_in_end` | – | 録音終了 → 応答生成要求 |
| `mode_set` | `value`（`general`/`interview`/`motivation`） | モード切替 |
| `bye` | – | セッション終了 |
| `pong` | – | heartbeat 応答 |

### Server → Device

| type | フィールド | 説明 |
|------|-----------|------|
| `auth_ok` | `session_id`, `audio` | 認証成功 |
| `state` | `value` | 状態通知 |
| `transcript` | `role`, `text` | 確定した発話テキスト |
| `assistant_text` | `text` | 字幕（デルタ可） |
| `audio_out_start` | `sample_rate`, `channels`, `format` | 出力音声開始 |
| (binary) | – | PCM16 出力チャンク |
| `audio_out_end` | – | 出力音声終了 |
| `error` | `code`, `message` | エラー |
| `ping` | – | heartbeat |

### エラーコード

`AUTH_FAILED` / `BAD_MESSAGE` / `PROVIDER_ERROR` / `NETWORK_ERROR` / `INTERNAL`

## Heartbeat

サーバーは `HEARTBEAT_INTERVAL_MS`（既定 20s）ごとに `ping` を送信。デバイスは `pong` を返す。応答が無い接続は次回スイープで切断される。

## 実装

- 定義の単一ソース: `backend/src/protocol/messages.js`
- ゲートウェイ実装: `backend/src/gateway/wsGateway.js`
- E2E 検証: `backend/test/e2e.test.js`
