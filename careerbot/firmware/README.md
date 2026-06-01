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
`ui_task` / `button_task` / `app_state_task` を起動します。

## Task 1（実装済みの範囲）

- **ボタン入力**: `components/app/button.c` が A/B ボタンを GPIO 入力 + デバウンスで
  読み、`app_on_button_a`（Push-to-talk）/ `app_on_button_b`（モード切替）を発火。
  GPIO 番号は `button.h` のマクロ（`CAREERBOT_BTN_A_GPIO` 等）で上書き可能 —
  **StopWatch の実際のピン配置に合わせて確認してください**（現状は仮の値）。
- **ロゴ表示**: 下記の手順で PNG を C 配列化し、`display_draw_logo()` が描画します。

### ロゴを組み込む

```bash
pip install pillow
python3 ../scripts/png_to_c.py ../assets/logo/careerbot.png \
    components/display/logo_img.c --width 180
```
生成した `logo_img.c` を `components/display/CMakeLists.txt` の SRCS に追加し、
`idf.py build` 時に `-DCAREERBOT_HAS_LOGO=1` を定義すると、`display_draw_logo()` が
RGB565 のロゴをパネルに blit します（パネル init / blit 部は実機 BSP に合わせて実装）。

> パネルコントローラの初期化・ピン配置・コーデック（esp_codec_dev / LVGL 等）は
> StopWatch 実機の資料に合わせて各 stub を埋めてください。

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
