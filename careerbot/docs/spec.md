# CareerBot 仕様書

就職相談向け音声AIアシスタント for **M5Stack StopWatch**。

## 1. 目的

StopWatch 上で動作する就職相談特化の音声AIアシスタント。自己分析 / 職種・業界相談 / 志望動機の壁打ち / 自己PR改善 / 面接練習 / 履歴書・職務経歴書相談 / 就活の進め方相談を音声で行える。

構成（いずれか、将来は切替可能に）:
1. OpenAI Realtime API 連携
2. 自前サーバー経由の音声対話基盤

## 2. ゴール / 非ゴール

**ゴール**: StopWatch 単体で音声入出力の会話 / 就職相談特化の応答 / ロゴ・状態・字幕表示 / OpenAI Realtime or 自前サーバー接続 / 会話履歴・プロファイルをサーバー管理 / 責務分離された構成。

**非ゴール（MVP）**: 常時ウェイクワード / 全二重 + AEC / 高度なオンデバイス推論 / 求人データ自動収集 / 内定保証や医療・法務・心理治療レベルの助言。

## 3. 前提条件

- ハード: M5Stack StopWatch（Wi‑Fi / MEMS マイク / スピーカー / 1.75" AMOLED タッチ / 物理ボタン / 振動モーター）
- ファーム: ESP-IDF 主軸（必要に応じ Arduino コンポーネント併用）
- バックエンド: Node.js（MVP 推奨）/ Python
- 通信: WebSocket 第一候補
- AI: OpenAI Realtime 優先、抽象化して自前サーバー差し替え可
- 言語: 日本語中心

## 4. 推奨アーキテクチャ

```
StopWatch ファームウェア → Relay / Application Server → LLM / Voice Layer
```

自前リレーサーバーを推奨する理由: APIキーをデバイスに持たせない / TLS・セッション・再接続の集約 / 会話履歴・ユーザー情報保持 / 就職相談向けプロンプト制御・RAG / プロバイダ差し替え / 音声変換・ログ収集。

- **ファームウェア**: マイク入力・音声バッファ・画面表示・スピーカー再生・Wi‑Fi・WS 通信
- **Relay/App Server**: デバイス認証・セッション管理・OpenAI 接続・会話履歴/プロファイル保存・ツール実行
- **LLM/Voice Layer**: OpenAI Realtime API or 自前音声対話サーバー

## 5. ユーザー像

新卒就活生 / 転職活動中の社会人 / 自己PR・面接が苦手な人 / 気軽な相談相手が欲しい人。
利用シーン: 面接練習、1日1回の進捗確認、志望動機の壁打ち、不安の言語化、面接前リハーサル。

## 6. プロダクトコンセプト

- 名前: キャリアボット / CareerBot
- キャラクター: 親しみやすい / 軽すぎない / 丁寧で前向き / 実務的 / 安心感
- ブランド表示: 起動スプラッシュ、待機メイン、接続中、発話中アニメ中心、管理画面ヘッダーに `assets/logo/` のロゴを使用

## 7. 会話機能仕様

**モード**: A. フリートーク相談 / B. 面接練習 / C. 自己PR・志望動機ブラッシュアップ / D. 進捗コーチング。

**基本フロー**: ボタン/タップで開始 → 「聞いています」→ 音声ストリーミング → AI 中継 → 音声応答 → 字幕表示 → 継続 or 終了。

**MVP 起動方式**: ① Push-to-talk ② タップ ③（将来）ウェイクワード。誤起動防止・実装簡易・エコー軽減・省電力のためボタン起動を採用。

## 8. デバイス UI 仕様

**画面状態**: 起動 / 待機 / リスニング / 応答生成中 / 発話中（字幕）/ エラー。

**ボタン**: A=会話開始(Push-to-talk) / B=モード切替 / 電源=システム制御。

**振動**: 会話開始=短く1回 / 応答受信=短く1回 / エラー=2回短振動。

## 9. 音声仕様

- 入力: モノラル / 16kHz PCM / chunk streaming
- 出力: 16k or 24kHz PCM/Opus、デバイス再生可能形式に統一
- 方式: MVP は半二重（発話中は録音停止）、将来 全二重 + AEC

## 10. システム機能要件

- **デバイス**: Wi‑Fi設定保存 / サーバーURL設定 / device_id / 音声送受信 / 状態表示 / 再接続 / 省電力待機
- **バックエンド**: デバイス認証 / セッション生成終了 / OpenAI 中継 / 会話履歴 / プロファイル / モード管理 / ログ閲覧 / ツール拡張口
- **AIアプリ**: ペルソナ制御 / 要約 / 面接練習 / 自己PR改善 / 志望動機FB / フォローアップ質問

## 11. 非機能要件

- レイテンシ: 発話終了→初回応答 2.0 秒以内（理想 1.0–1.5s）
- 可用性: 単一障害で完全停止しない設計が望ましい（MVP は単一可）
- セキュリティ: APIキーをデバイスに保存しない / サーバー発行トークン認証 / TLS / 個人情報ログ規則
- プライバシー: 保存可否を選択可能 / 削除機能
- 保守性: デバイス/サーバー/AI 層分離、音声プロバイダ差し替え可、依存を抽象化

## 12. ソフトウェア構成

リポジトリ構成と各層の責務は [`../README.md`](../README.md) およびコード（`backend/src/`, `firmware/components/`）を参照。

## 13. 通信プロトコル

詳細は [`api.md`](api.md)。WebSocket + JSON 制御 + バイナリ音声。

## 14–16. AIペルソナ / 応答ルール / モード別仕様

詳細は [`prompt.md`](prompt.md)。共感→整理→提案→具体例→次の質問。3モード（general / interview / motivation）。

## 17. データモデル（サーバー側）

実装: `backend/src/repositories/`（`MemoryRepo` / `SqliteRepo`）。

```jsonc
// UserProfile
{ "user_id": "u001", "name": "optional",
  "target_type": "new_grad | career_change",
  "target_industries": ["IT"], "target_roles": ["PM"],
  "strengths": ["継続力"], "notes": "面接が苦手" }

// ConversationSession
{ "session_id": "sess_001", "user_id": "u001",
  "mode": "general | interview | motivation",
  "started_at": "ISO8601", "ended_at": "ISO8601", "summary": "..." }

// Message
{ "message_id": "msg_001", "session_id": "sess_001",
  "role": "user | assistant", "text": "...", "created_at": "ISO8601" }
```

## 18. 実装優先順位

- **Phase 1 (MVP)**: Wi‑Fi / WS / Push-to-talk / 音声送受信 / ロゴ表示 / 通常相談 / OpenAI Realtime / 会話履歴（最小）
- **Phase 2**: 面接・志望動機モード / UI 改善 / プロファイル / エラー回復強化
- **Phase 3**: ウェイクワード / 全二重 / AEC / RAG / 管理画面

## 19. 技術選定

- ファーム: ESP-IDF。FreeRTOS タスク分離（`ui_task` / `audio_capture_task` / `audio_playback_task` / `network_task` / `app_state_task`）
- バックエンド: Node.js（MVP 推奨）
- DB: MVP は SQLite or PostgreSQL、本番は PostgreSQL

## 20. エラー処理

- デバイス: Wi‑Fi未接続→再接続画面 / サーバー切断→自動再接続 / 音声初期化失敗→エラー表示 / バッテリー低下→省電力警告
- サーバー: OpenAI 失敗→fallback message / セッションタイムアウト / 不正デバイス拒否

## 21. テスト観点

[`test-plan.md`](test-plan.md) を参照。

## 22. 受け入れ基準（MVP）

[`test-plan.md`](test-plan.md) 末尾のチェックリストを参照。

## 23. リスクと対策

- エコー/ハウリング → MVP 半二重・発話中録音停止・将来 AEC
- レイテンシ → Realtime + chunk streaming + サーバー近接
- API 秘密漏洩 → リレーサーバー方式
- 相談品質 → 専用プロンプト・モード別設計・会話要約とプロファイル記憶

## 24. タスク分解（AI駆動開発）

| Task | 内容 | 状態 |
|------|------|------|
| 1 | ESP-IDF プロジェクト初期化（display hello / button） | 🧱 雛形 |
| 2 | Wi‑Fi 接続（NVS 保存 / 状態コールバック） | 🧱 雛形 |
| 3 | WebSocket クライアント（reconnect / JSON / binary） | 🧱 雛形 |
| 4 | 音声入力（MIC / PCM capture / chunk 化） | 🧱 雛形 |
| 5 | 音声出力（speaker / playback / queue） | 🧱 雛形 |
| 6 | 状態管理と UI（idle/listening/thinking/speaking/error + ロゴ） | 🧱 雛形 |
| 7 | Node.js バックエンド雛形（WS サーバー / session / health） | ✅ 実装 |
| 8 | OpenAI Realtime adapter（session / audio relay / response relay） | ✅ 実装 |
| 9 | CareerBot プロンプト実装（3モード） | ✅ 実装 |
| 10 | 永続化（profile / session log / summary） | ✅ 実装 |
| 11 | E2E テスト（会話成立 / エラー回復） | ✅ 会話成立を自動検証 |
