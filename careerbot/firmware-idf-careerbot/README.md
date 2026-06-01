# CareerBot 実機ファーム（ESP-IDF / 公式デモHALベース）

公式 `M5StopWatch-UserDemo` の HAL（画面・ES8311音声・ボタン・振動）を流用し、
`main/main.cpp` を CareerBot 版に差し替えて動かします。

**まず目標**: Aボタン → gemma4 が回答 → **ずんだもんが実機スピーカーで発話**＋丸画面に表示。
（Whisper不要。ボタンでサンプル質問を送る方式。マイク録音は後で追加）

## 手順

前提: 公式デモが既に `idf.py flash` で動作していること（画面が出た状態）。

### 1. ファイルを差し替え（デモ版はバックアップ）
```bash
cd ~/M5StopWatch-UserDemo
cp main/main.cpp main/main.cpp.demo.bak
cp ~/careerbot-repo/careerbot/firmware-idf-careerbot/main.cpp        main/main.cpp
cp ~/careerbot-repo/careerbot/firmware-idf-careerbot/careerbot_config.h main/careerbot_config.h
cp ~/careerbot-repo/careerbot/firmware-idf-careerbot/logo_img.h      main/logo_img.h
```

### 2. 接続設定を編集
```bash
open -e main/careerbot_config.h
ipconfig getifaddr en0     # Mac の LAN IP を確認
```
- `WIFI_SSID` / `WIFI_PASS`
- `SERVER_URI` を `ws://<MacのIP>:8090/ws` に（例 `ws://192.168.3.50:8090/ws`）

### 3. WebSocket クライアント依存を追加
`main/idf_component.yml` の `dependencies:` の下に1行追加（インデントは半角2）:
```yaml
  espressif/esp_websocket_client: "^1.4.0"
```

### 4. Mac でリレーサーバーを起動（Ollama + VOICEVOX 起動済みで）
```bash
cd ~/careerbot-repo/careerbot/backend
VOICE_PROVIDER=local LLM_MODEL=gemma4:e4b PORT=8090 npm start
```

### 5. ビルド＆書き込み（シリアルモニタは閉じてから）
```bash
cd ~/M5StopWatch-UserDemo
. ~/esp/esp-idf/export.sh
idf.py -p /dev/cu.usbmodem1101 flash monitor
```

起動すると丸画面に「CareerBot / 待機中 / Aボタンで相談」。
**A を押す**と質問が送られ、考え中 → ずんだもんが実機で発話＋画面に回答。**B** でモード切替。

## デモに戻す
```bash
cp ~/M5StopWatch-UserDemo/main/main.cpp.demo.bak ~/M5StopWatch-UserDemo/main/main.cpp
```

## 操作
- **A 短押し（タップ）**: サンプル質問を送る（Whisper不要）
- **A 長押し**: 押している間あなたの声を録音 → 送信（**Whisper必要**）
- **B**: モード切替（相談 / 面接 / 志望動機）

## 自分の声で会話する（Whisper STT を起動）
Mac で Whisper(OpenAI互換サーバー)を起動します。Docker が手早いです：
```bash
docker run --rm -p 8000:8000 fedirz/faster-whisper-server:latest-cpu
```
起動後、リレーサーバーは既定で `STT_URL=http://localhost:8000/v1/audio/transcriptions`
を見るので、そのまま A 長押しで話せば「声→Whisper→gemma→ずんだもん」が回ります。
（別のWhisper実装を使う場合は `.env` の `STT_URL` を合わせてください）

## 次の段階（後で）
- 字幕のスクロール表示、ロゴアニメーション

## メモ
- うまく音が出ない時はサーバーログ（`provider:local`）と VOICEVOX(`curl localhost:50021/version`)を確認。
- ビルドエラーが出たら全文を貼ってください（HAL/フォントのAPI差異があれば調整します）。
