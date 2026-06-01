# CareerBot Firmware — M5Stack StopWatch (Arduino / M5Unified)

実機（StopWatch, ESP32-S3 / 丸型466×466 AMOLED / ES8311音声）向けの Arduino ファーム。
リレーサーバーへ WebSocket 接続し、A=押して話す / B=モード切替 / 画面に状態とロゴ、
スピーカーで応答音声を再生します（プロトコルは `../docs/api.md`）。

## ⚡ ターミナルだけで書き込む（推奨）

GUI 不要。`config.h` を編集したら、Mac でこれ1コマンド：
```bash
cd careerbot/firmware-arduino
bash flash.sh                 # ポート自動検出（または bash flash.sh /dev/cu.usbmodemXXXX）
```
`flash.sh` が arduino-cli・ESP32コア・ライブラリの導入 → ロゴ埋め込み(PNG→RGB565、要 Pillow)
→ コンパイル → 書き込み まで自動で行います。シリアル確認は
`arduino-cli monitor -p <PORT> -c baudrate=115200`。

> ロゴ埋め込みに Pillow を使います（`pip3 install pillow`）。無い場合は簡易表示にフォールバック。

## 必要ライブラリ（手動 / Arduino IDE を使う場合）
- **M5Unified**（M5Stack）
- **ArduinoJson**（Benoit Blanchon）
- **WebSockets**（Markus Sattler / links2004）

## ボード設定
- ボードマネージャに **esp32 by Espressif**（ESP32-S3対応）を入れる
- ボード: **ESP32S3 Dev Module** 系（StopWatch 用の定義があればそれを選択）
- PSRAM: **OPI PSRAM** を有効化、Flash: 16MB

> ⚠️ StopWatch は新しいデバイスです。M5Unified が丸型AMOLED(CO5300 QSPI)/ES8311 を
> 自動認識しない場合は、**M5Stack 公式の StopWatch サンプル/最新 M5Unified** を導入して
> から本スケッチを載せてください。`M5.Display` / `M5.Mic` / `M5.Speaker` が動けばOKです。

## 手順

1. `config.h` を編集
   - `WIFI_SSID` / `WIFI_PASS`
   - `SERVER_HOST` = **Mac の LAN IP**（`ipconfig getifaddr en0` で確認、`localhost`不可）
   - `SERVER_PORT` = サーバーのポート（例 8090）
2. ロゴをデバイスに置く（任意・推奨）
   - `careerbot/data/careerbot.png` を用意（466幅以下に縮小推奨）
   - Arduino IDE の **LittleFS Upload** ツールで書き込む（無ければロゴは簡易表示にフォールバック）
3. Mac 側でリレーサーバーを LAN から見えるように起動
   ```bash
   cd careerbot/backend
   VOICE_PROVIDER=local LLM_MODEL=gemma4:e4b PORT=8090 npm start
   ```
4. スケッチを書き込み（Upload）

起動すると Wi-Fi 接続 → サーバーへ `hello` → 画面が「待機中」。
**A を押している間**話し、離すと送信 → gemma4 が考え → ずんだもんが応答を再生します。

## メモ
- 半二重: 録音中はスピーカー停止、再生中はマイク停止（M5Unified の Mic/Speaker を切替）。
- 音声入力には Mac 側で Whisper(STT) が必要です（未導入ならテキスト入力で先に確認）。
- まず「画面ロゴ＋状態＋ボタン」が出れば Task 1 達成。音声は STT/TTS が揃ってから。
