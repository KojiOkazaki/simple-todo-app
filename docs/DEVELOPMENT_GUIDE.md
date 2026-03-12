# 自己分析ワークスペース — 開発手順書

## 1. プロジェクト概要

就活生向けの **自己分析ワークスペース** アプリケーションです。
AI（Google Gemini）を活用して、自己分析・自己PR作成・ガクチカ深掘りなどを支援します。

### 主な機能

| タブ | 機能 |
|------|------|
| 自分史・チャート | 人生のモチベーション推移をグラフで可視化 |
| 強み発見・自己PR | 経済産業省12の能力をベースに強みを特定、AI で自己PR生成 |
| ガクチカ深掘り | 学生時代の取り組みを構造的に整理 |
| 価値観・企業選び | コア価値観の選択と企業選びの軸を定義 |
| 分析結果まとめ | AI が全データを統合して総合レポートを生成 |

### 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | React 18 + TypeScript |
| スタイリング | Tailwind CSS 4 |
| ビルドツール | Vite 5 |
| アイコン | Lucide React |
| AI | Google Gemini API |

---

## 2. 環境構築（初回セットアップ）

### 前提条件

- **Node.js** v18 以上（推奨: v20）
- **npm** v9 以上
- **Git**

Node.js のインストール確認：

```bash
node -v   # v18.x.x 以上であること
npm -v    # v9.x.x 以上であること
```

> Node.js が入っていない場合は https://nodejs.org/ からインストールしてください。

### 手順

#### ① リポジトリのクローン

```bash
git clone https://github.com/KojiOkazaki/simple-todo-app.git
cd simple-todo-app
```

#### ② 依存パッケージのインストール

```bash
npm install
```

#### ③ 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを開き、Gemini API キーを設定します：

```
VITE_GEMINI_API_KEY=あなたのAPIキーをここに貼り付け
```

> **Gemini API キーの取得方法：**
> 1. [Google AI Studio](https://aistudio.google.com/) にアクセス
> 2. 「Get API key」をクリック
> 3. 新しいキーを作成してコピー

#### ④ 開発サーバーの起動

```bash
npm run dev
```

ブラウザで **http://localhost:5173** にアクセスすれば画面が表示されます。

---

## 3. 日常の開発フロー

### 開発サーバーの起動（毎回）

```bash
cd simple-todo-app
npm run dev
```

> PC を再起動した後も、このコマンドだけで開発サーバーが立ち上がります。

### 最新コードの取得

GitHub 上で更新があった場合：

```bash
git pull origin main
npm install          # 依存関係が変わった場合のみ必要
```

### 開発サーバーの停止

ターミナルで `Ctrl + C` を押します。

---

## 4. プロジェクト構成

```
simple-todo-app/
├── src/
│   ├── components/         # React コンポーネント
│   │   ├── Header.tsx         # ヘッダー
│   │   ├── Sidebar.tsx        # サイドバーナビゲーション
│   │   ├── ChatPanel.tsx      # AI チャットパネル
│   │   ├── Dashboard.tsx      # 分析結果まとめ
│   │   ├── LifelineTab.tsx    # 自分史タブ
│   │   ├── LifelineGraph.tsx  # モチベーショングラフ
│   │   ├── StrengthsTab.tsx   # 強み発見タブ
│   │   ├── GakuchikaTab.tsx   # ガクチカタブ
│   │   ├── ValuesTab.tsx      # 価値観タブ
│   │   └── GuideModal.tsx     # 使い方ガイド
│   ├── hooks/              # カスタムフック
│   │   ├── useChat.ts         # チャット状態管理
│   │   └── useWorksheet.ts    # ワークシートデータ管理
│   ├── lib/                # ユーティリティ
│   │   ├── constants.ts       # 定数（タブ定義、強み一覧、価値観一覧）
│   │   └── gemini.ts          # Gemini API クライアント
│   ├── App.tsx             # メインアプリコンポーネント
│   ├── App.css             # アプリスタイル
│   ├── index.css           # グローバルスタイル
│   ├── types.ts            # TypeScript 型定義
│   ├── main.tsx            # エントリーポイント
│   └── vite-env.d.ts       # Vite 型定義
├── docs/                   # ドキュメント
├── index.html              # HTML テンプレート
├── package.json            # 依存関係とスクリプト
├── tsconfig.json           # TypeScript 設定
├── vite.config.ts          # Vite 設定
├── .env.example            # 環境変数テンプレート
└── .env                    # 環境変数（※Git管理外）
```

---

## 5. npm スクリプト一覧

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバーを起動（ホットリロード対応） |
| `npm run build` | TypeScript コンパイル + 本番ビルド |
| `npm run preview` | 本番ビルドをローカルでプレビュー |

---

## 6. コードの修正方法

### 新しい機能を追加する流れ

1. **ブランチを作成**
   ```bash
   git checkout -b feature/機能名
   ```

2. **コードを編集**
   `src/` 配下のファイルを変更 → 保存すると自動でブラウザに反映されます。

3. **変更をコミット**
   ```bash
   git add .
   git commit -m "機能の説明"
   ```

4. **GitHub にプッシュ**
   ```bash
   git push -u origin feature/機能名
   ```

### よく編集するファイル

| やりたいこと | 対象ファイル |
|------------|-------------|
| 画面のレイアウト変更 | `src/components/*.tsx` |
| AI のプロンプト調整 | `src/hooks/useChat.ts` |
| 強み・価値観リストの変更 | `src/lib/constants.ts` |
| 型定義の変更 | `src/types.ts` |
| グローバルスタイルの変更 | `src/index.css` |

---

## 7. 本番ビルドとデプロイ

### ビルド

```bash
npm run build
```

`dist/` フォルダに本番用ファイルが生成されます。

### ビルドの確認

```bash
npm run preview
```

### デプロイ先の例

- **Vercel**: GitHub リポジトリを接続するだけで自動デプロイ
- **Netlify**: `dist/` フォルダをドラッグ＆ドロップ
- **GitHub Pages**: `dist/` フォルダの内容を公開

---

## 8. トラブルシューティング

### `npm run dev` でエラーが出る

```bash
rm -rf node_modules
npm install
npm run dev
```

### ポート 5173 が使用中

別のターミナルで `npm run dev` が動いている可能性があります。
先に `Ctrl + C` で停止してから再実行してください。

### AI チャットが応答しない

- `.env` ファイルに正しい API キーが設定されているか確認
- API キーの利用制限（レートリミット）に達していないか確認
- ブラウザの開発者ツール（F12）→ Console でエラーを確認

### TypeScript のエラーでビルドできない

```bash
npm run build
```

エラーメッセージに表示されるファイル名と行番号を確認して修正してください。
