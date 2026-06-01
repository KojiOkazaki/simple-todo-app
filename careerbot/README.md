# CareerBot（キャリアボット）

就職相談向け音声AIアシスタント for **M5Stack StopWatch**。

ユーザーはデバイスに話しかけることで、自己分析・職種/業界相談・志望動機の壁打ち・自己PR改善・面接練習・進捗コーチングなどを音声で行えます。

> 構成: `StopWatch → 自前リレーサーバー → OpenAI Realtime API`
> APIキーはデバイスに持たせず、リレーサーバーで認証・会話履歴・プロンプト制御を行います。

## リポジトリ構成

```
careerbot/
  README.md            このファイル
  docs/                仕様・API・プロンプト・テスト計画
    spec.md
    api.md
    prompt.md
    test-plan.md
  firmware/            M5Stack StopWatch ファームウェア (ESP-IDF) ※雛形
    main/
    components/{audio,display,network,ui,storage,app}/
  backend/             Node.js リレーサーバー（実装済み・動作確認済み）
    src/{server,gateway,realtime,services,repositories,prompts,tools,protocol}/
    test/
  infra/               docker-compose / nginx
  assets/logo/         ブランドロゴ
  scripts/
```

## 現在の実装状況

| レイヤ | 状態 |
|--------|------|
| バックエンド（リレーサーバー） | ✅ 動作（mock プロバイダで E2E テスト通過） |
| OpenAI Realtime アダプタ | ✅ 実装済み（要 API キー） |
| ローカル音声パイプライン（Whisper + Gemma + VOICEVOX） | ✅ 実装済み（[docs/local-voice.md](docs/local-voice.md)） |
| 3モードのプロンプト（相談/面接/志望動機） | ✅ 実装済み |
| 会話履歴・プロファイル永続化（memory / sqlite） | ✅ 実装済み |
| ロゴ表示（バックエンド `/logo` + スプラッシュ） | ✅ 実装済み |
| ファームウェア（ESP-IDF） | 🧱 雛形 + Task 1（ボタン入力 / ロゴ組込み手順） |

詳細なロードマップは [`docs/spec.md`](docs/spec.md) の「実装優先順位」「タスク分解」を参照。

## クイックスタート（バックエンド）

```bash
cd backend
npm install
cp .env.example .env      # 必要に応じて編集
npm test                  # 13 tests, all pass（mock プロバイダで E2E 含む）
npm start                 # :8080 で起動、WebSocket は /ws
curl localhost:8080/healthz
```

OpenAI Realtime に接続するには `.env` で `VOICE_PROVIDER=openai` と `OPENAI_API_KEY=...` を設定します。
オフライン開発・CI では `VOICE_PROVIDER=mock`（既定）で API キー不要で全パイプラインを検証できます。
ローカル構成（Whisper + Gemma + VOICEVOX）は `VOICE_PROVIDER=local`（[docs/local-voice.md](docs/local-voice.md)）。

### ブラウザ・テストクライアント

デバイスが無くても、サーバー起動後に **http://localhost:8080/client** を開けば、
文字入力（`text_in`）またはマイク（押して話す）で CareerBot と会話できます。
`local` 構成なら ずんだもん の声で応答が返ります（文字入力なら Whisper 不要）。

詳しくは [`backend/README.md`](backend/README.md)。

## ライセンス / 注意

本システムは就職・転職活動の相談支援を目的とし、採用の保証や、医療・法務・心理治療レベルの助言は行いません（[`docs/prompt.md`](docs/prompt.md) の禁止事項を参照）。
