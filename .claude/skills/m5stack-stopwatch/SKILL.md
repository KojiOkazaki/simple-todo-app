---
name: m5stack-stopwatch
description: Use when building, flashing, or debugging firmware/apps for the M5Stack StopWatch (ESP32-S3R8, 1.75" round AMOLED). Covers the required ESP-IDF UserDemo base (M5Unified does NOT support this board), the HAL API, the audio-streaming patch that avoids OOM, round-screen display/fonts, flashing troubleshooting, and a relay-server voice-assistant pattern. Triggers on "M5Stack StopWatch", "StopWatch dev kit", CO5300/ES8311/CST820/M5PM1/M5IOE1, or round AMOLED ESP32-S3 watch projects.
---

# M5Stack StopWatch app development

Hard-won, board-specific knowledge for the **M5Stack StopWatch Dev Kit (ESP32-S3)**.
Read this before writing code — several "obvious" approaches do NOT work on this board.

## Hardware facts

- SoC: **ESP32-S3R8**, 16MB Flash, **8MB PSRAM** (octal).
- Display: **1.75" round AMOLED, 466×466, CO5300 driver, QSPI**.
- Touch: **CST820** (I2C).
- Audio: **ES8311 codec** + MEMS mic + AW8737A amp. Codec runs at **44100 Hz mono**.
- Power/IO: **M5PM1** (PMIC) + **M5IOE1** (IO expander) — the display power/backlight,
  speaker enable, and vibration are behind these. They must be initialized.
- Buttons: 2 programmable (GPIO **1** and **2**) + power button. Vibration motor. IMU BMI270, RTC RX8130CE.
- USB: native **USB-Serial/JTAG** (CDC), shows up as `/dev/cu.usbmodem*`.

## ⚠️ Critical: use the official ESP-IDF demo as the base — NOT M5Unified

**M5Unified / M5GFX do NOT drive this board** (autodetect gives `display=0x0`, blank
screen) because the panel power needs M5PM1/M5IOE1, which M5Unified doesn't init.

Base every app on M5Stack's official demo:
**https://github.com/m5stack/M5StopWatch-UserDemo** (ESP-IDF, uses M5GFX + M5PM1 +
M5IOE1 + LVGL + a `mooncake` app framework). Bring it up first, then add your app
(simplest: replace `main/main.cpp` and drive everything via `GetHAL()`).

### Build/flash the demo
```bash
# ESP-IDF (v5.4+; demo README says 5.5.4)
cd ~/M5StopWatch-UserDemo
python3 ./fetch_repos.py            # pulls M5GFX/M5PM1/M5IOE1/lvgl/mooncake etc.
idf.py set-target esp32s3
idf.py -p /dev/cu.usbmodemXXXX flash monitor
```

### The demo won't compile on modern ESP-IDF (strict -Werror)
M5IOE1 etc. use `%u` with `uint32_t` → `-Werror=format`. Add to the **top-level
`CMakeLists.txt`** before `project(...)`:
```cmake
idf_build_set_property(COMPILE_OPTIONS "-Wno-error;-Wno-format" APPEND)
```

## HAL API (`#include "hal/hal.h"`, `GetHAL()`)

```cpp
LGFX_Device& getDisplay();          // M5GFX: fillScreen, drawString, pushImage,
                                    //        pushImageRotateZoom, setClipRect, setFont...
void audioRecord(std::vector<int16_t>& out, uint16_t durationMs, float gain=30); // mic, blocking
void audioPlay(std::vector<int16_t>& data, bool async);   // ⚠️ async COPIES whole buffer (OOM risk)
int  getAudioSampleRate();          // 44100
void setSpeakerVolume(int v, bool save);   // 0..255
m5::Button_Class btnA, btnB, btnPwr;       // call updateButtonStates() each loop
void vibrate(uint16_t ms, uint8_t strength=100);
```
`getDisplay()` works for direct drawing if you DON'T pump LVGL (skip the mooncake loop).

## ⚠️ Audio: stream to the codec, don't buffer the whole clip

`Hal::audioPlay(data, async=true)` copies the entire clip into internal RAM via the
default allocator. Internal heap is ~250–300KB, so any multi-second reply (44.1kHz =
~88KB/s) **aborts with bad_alloc** or trips the **task watchdog** during resample.
Do NOT try to fix this with `CONFIG_SPIRAM_USE_MALLOC` — it destabilizes the demo
(audio DMA / WiFi). Capping reply length is not viable (only ~10–15 chars fit).

**Solution: add a direct streaming-write to the HAL and feed small chunks.** The demo's
play task already uses `esp_codec_dev_write(_codec_dev, ...)`; expose it. Apply once
(`reference/add_audiowrite.sh` does this via perl):

- `main/hal/hal.h` — declare after `audioPlay`:
  ```cpp
  void audioWrite(const int16_t* data, size_t samples);
  ```
- `main/hal/hal_audio.cpp` — add a method to the `AudioCodec` class (before `void play(`):
  ```cpp
  void writeChunk(const int16_t* p, size_t n) {
      std::lock_guard<std::mutex> lock(_mutex);
      esp_codec_dev_write(_codec_dev, (void*)p, n * sizeof(int16_t));
  }
  ```
- `main/hal/hal_audio.cpp` — after `Hal::audioPlay`:
  ```cpp
  void Hal::audioWrite(const int16_t* data, size_t samples) {
      _audio_codec.writeChunk(data, samples);
  }
  ```

Then, as each PCM chunk arrives, resample to 44100 and `audioWrite(out.data(), out.size())`.
Continuous writes = no gaps, tiny memory, any length. Do it in the receiving (e.g.
websocket) task; the main loop stays free to animate the UI. Resample with **integer**
math (per-sample `double` division trips the watchdog on long audio).

## Display tips (round 466×466)

- The corners are clipped: keep important content within roughly **y ∈ [46, 420]**.
- Use **gothic** fonts, not mincho: `&fonts::lgfxJapanGothic_16/20/24/40` (NOT `lgfxJapanMincho_*`).
- Scale an embedded RGB565 logo with `pushImageRotateZoom(cx, cy, w/2, h/2, 0, zoom, zoom, w, h, data)`
  after `setSwapBytes(true)`. Generate the header from a PNG with Pillow (RGB565).
- For scrolling "news-ticker" text: `setClipRect(x,y,w,h)` a band, `fillRect` it, draw the
  string at a decreasing x each frame, `clearClipRect()`. Redraw the static layer (logo) only
  on change to avoid flicker; animate only the band each frame.

## Flashing troubleshooting (native USB)

- **Close the serial monitor before flashing** (`Ctrl+]` to exit `idf.py monitor`); the port
  is exclusive. `lsof -t /dev/cu.usbmodemXXXX | xargs kill -9` frees it.
- "**No serial data received**": usually the device is in a crash-reboot loop making USB-CDC
  unstable. Unplug/replug, retry; one good flash stops the loop. Holding button A/B during
  "Connecting…" can force download mode.
- Auto-detect grabs `/dev/cu.Bluetooth-Incoming-Port` if you're not careful — pass the real
  `usbmodem` port explicitly.

## Common pitfalls (summary)

| Symptom | Cause / fix |
|--------|-------------|
| Blank screen, `display=0x0` | M5Unified unsupported → use the ESP-IDF UserDemo base |
| `-Werror=format` build fail | add `-Wno-error;-Wno-format` to top CMakeLists |
| Reboot a few sec into audio | OOM/watchdog from whole-clip `audioPlay` → stream via `audioWrite` |
| Super-fast / wrong-pitch voice | codec is 44100; resample your 16k audio up to `getAudioSampleRate()` |
| Reboot on short clips after enabling PSRAM malloc | `CONFIG_SPIRAM_USE_MALLOC` breaks the demo — don't use it |
| Choppy audio / UI flicker | don't call `audioPlay` per small segment (it appends silence + copies); use continuous `audioWrite` |

## Worked example

`careerbot/firmware-idf-careerbot/` in this kind of project is a complete app: WiFi +
`esp_websocket_client` to a relay server, push-to-talk mic, round-screen logo + scrolling
captions, and the streaming `audioWrite` playback. The companion relay (`careerbot/backend`)
runs Whisper (STT) → LLM → VOICEVOX (TTS) locally and speaks 16k PCM the device upsamples.
Mirror that structure for new voice apps.
