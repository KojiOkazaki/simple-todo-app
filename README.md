# Interview Simulation Service

DialogLab (UIST 2025) の研究に基づくマルチエージェント面接シミュレーションサービス。
複数のAI面接官がアバター付きでリアルな面接体験を提供します。

## Architecture

DialogLab のアーキテクチャに基づき、以下のコンポーネントで構成されています:

```
interview-simulation/
├── client/                    # React + Vite フロントエンド (port 5173)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts     # Server API クライアント
│   │   ├── components/
│   │   │   ├── AvatarView.tsx       # Canvas 2Dアバター (TalkingHead風)
│   │   │   ├── InterviewFeedback.tsx # フィードバック画面
│   │   │   ├── InterviewSession.tsx  # 面接セッション画面
│   │   │   ├── InterviewSetup.tsx    # 面接設定画面
│   │   │   └── MessageBubble.tsx     # メッセージ表示
│   │   ├── engine/
│   │   │   ├── InterviewEngine.ts   # 会話オーケストレーション
│   │   │   ├── evaluator.ts         # ルールベース評価
│   │   │   ├── personas.ts          # 面接官ペルソナ定義
│   │   │   ├── questions.ts         # 質問バンク
│   │   │   └── scenarios.ts         # シナリオ・シーン管理
│   │   ├── types.ts                 # 型定義
│   │   ├── App.tsx                  # メインアプリ
│   │   └── App.css                  # スタイル
│   ├── index.html
│   └── vite.config.ts               # Vite + API proxy 設定
│
├── server/                    # Express API サーバー (port 3010)
│   ├── providers/
│   │   ├── gemini.js          # Google Gemini プロバイダー
│   │   └── openai.js          # OpenAI GPT プロバイダー
│   ├── routes.js              # API ルーティング
│   ├── server.js              # Express エントリポイント
│   └── .env.example           # 環境変数テンプレート
│
└── package.json               # ルートワークスペース
```

## Features

### Multi-Agent Conversation System
- **Persona-based Interviewers**: 5名の異なるペルソナ (田中部長, 鈴木課長, 山田取締役, 佐藤主任, 渡辺人事)
- **Turn-taking Management**: DialogLab 式のターンテイキング制御
- **Phase Progression**: 導入 → 自己紹介 → 志望動機 → 経験 → 強み弱み → 業界質問 → 逆質問 → 終了

### Interview Types & Scenarios
- **Individual Interview** (個人面接): 1対1 の標準面接・圧迫面接
- **Panel Interview** (パネル面接): 複数面接官による質問
- **Group Interview** (集団面接): 簡潔な回答が求められるスタイル
- **Scene Management**: シナリオごとのアバター配置・カメラ位置設定

### Multi-LLM Provider Support
- **Google Gemini**: `gemini-2.0-flash` によるAI面接官応答
- **OpenAI GPT**: `gpt-4` によるAI面接官応答
- **Rule-based Fallback**: サーバー未接続時はルールベースで動作
- **Server-side Key Management**: APIキーをサーバー側で安全に管理

### Avatar System
- **Canvas 2D Animated Avatars**: TalkingHead風のリアルタイムアバターアニメーション
- **Lip-sync Animation**: 発話時の口パクアニメーション
- **Idle Animation**: 呼吸・まばたき・頭の動きアニメーション
- **Persona-specific Appearance**: ペルソナごとの外見・表情設定

### Evaluation System
- **5-Axis Scoring**: 関連性・構成力・具体性・熱意・伝達力
- **Phase-based Breakdown**: フェーズ別スコア分析
- **STAR Method Detection**: STAR法準拠の構成評価
- **AI-enhanced Evaluation**: LLMモード時はAIによる詳細な評価

## Setup

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# 全体の依存関係をインストール
npm run install:all

# または個別にインストール
cd client && npm install
cd ../server && npm install
```

### Server Configuration (Optional)

AIモードを使用する場合、`server/.env` を作成します:

```bash
cp server/.env.example server/.env
```

`.env` ファイルに API キーを設定:

```env
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
DEFAULT_LLM_PROVIDER=gemini
```

### Running

```bash
# クライアントのみ (ルールベースモード)
npm run dev:client

# サーバー + クライアント (AIモード)
npm run dev:server   # ターミナル1
npm run dev:client   # ターミナル2
```

- Client: http://localhost:5173
- Server: http://localhost:3010

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | サーバーステータス確認 |
| GET | `/api/providers` | 利用可能なLLMプロバイダー一覧 |
| POST | `/api/interview/respond` | AI面接官の応答生成 |
| POST | `/api/interview/evaluate` | 回答の評価 |
| POST | `/api/interview/closing` | 面接終了メッセージ生成 |
| POST | `/api/tts/synthesize` | テキスト音声合成 (TTS) |

## Design Principles

DialogLab の設計哲学に基づき:

1. **Social Setup と Temporal Progression の分離**: 「誰が話すか」と「会話の流れ」を独立管理
2. **Multi-Agent Architecture**: 各面接官が独自のペルソナ・話し方パターンを持つ
3. **Graceful Degradation**: サーバー未接続 → ルールベース、アバター無効 → テキストのみ
4. **Server-side LLM**: APIキーをクライアントに露出せず安全にLLM呼び出し

## References

- DialogLab: A Multi-Agent Dialogue System for Authoring and Simulating Conversation (UIST 2025)
