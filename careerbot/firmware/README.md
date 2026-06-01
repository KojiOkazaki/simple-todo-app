# CareerBot Firmware (M5Stack StopWatch / ESP-IDF)

責務分離した ESP-IDF プロジェクトの**雛形**です。各コンポーネントは `include/` に
インターフェースを定義し、実装は stub（`// TODO(Task n)` 付き）になっています。

## コンポーネント（spec 12.2 / Task 1-6）

| component | 責務 | Task |
|-----------|------|------|
| `storage` | NVS 保存（Wi‑Fi / device_id / backend_url / token） | 2 |
| `network` | Wi‑Fi STA + WebSocket クライアント（reconnect / JSON / binary） | 2, 3 |
| `audio`   | I2S MIC capture + speaker playback（PCM16 16kHz, half-duplex） | 4, 5 |
| `display` | AMOLED パネル init + 低レベル描画 | 1, 6 |
| `ui`      | 画面状態（boot/idle/listening/thinking/speaking/error）+ 字幕 | 6 |
| `app`     | 状態機械・イベント統合（ボタン / サーバーイベント） | 6 |

## タスク構成（FreeRTOS, spec 19）

`main/main.c` が `network_task` / `audio_capture_task` / `audio_playback_task` /
`ui_task` / `app_state_task` を起動します。

## ビルド

```bash
. $IDF_PATH/export.sh
idf.py set-target esp32s3
idf.py menuconfig      # Wi-Fi/backend_url 等
idf.py build flash monitor
```

> 注: ボード固有のピン定義・パネルドライバ・コーデック（esp_codec_dev / LVGL 等）は
> StopWatch の実機資料に合わせて各 stub に実装してください。プロトコルは
> [`../docs/api.md`](../docs/api.md) に準拠します。
