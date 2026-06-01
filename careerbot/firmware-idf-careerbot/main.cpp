// CareerBot — M5Stack StopWatch firmware (ESP-IDF), built on the official
// UserDemo HAL (display / ES8311 audio / buttons / vibration).
//
// This REPLACES the demo's main/main.cpp. It skips the mooncake/LVGL app
// suite and drives CareerBot directly via GetHAL():
//   A button = ask CareerBot (sends a sample question; no STT needed yet)
//   B button = cycle mode (相談 / 面接 / 志望動機)
//   round screen = logo text + state + reply caption
//   speaker = plays the assistant's VOICEVOX voice
//
// Mac side must be running:  VOICE_PROVIDER=local (Ollama + VOICEVOX).
// Add the websocket client component (see README): espressif/esp_websocket_client.

#include <string>
#include <vector>
#include <cstring>
#include <cstdarg>

#include "hal/hal.h"
#include "careerbot_config.h"

// Embedded CareerBot logo (RGB565). Copy logo_img.h into main/ alongside this
// file; if absent, a text header is shown instead.
#if defined(__has_include)
# if __has_include("logo_img.h")
#  include "logo_img.h"
#  define HAVE_LOGO 1
# endif
#endif

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "nvs_flash.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "esp_websocket_client.h"
#include "cJSON.h"

static const char* TAG = "careerbot";

// ---- shared UI state ----
static std::string g_state   = "接続中…";
static std::string g_caption = "";
static std::string g_pending = "";  // reply text, shown only when audio starts
static volatile bool g_dirty = true;
static volatile bool g_playPending = false;
static std::vector<int16_t> g_playbuf;
static std::vector<int16_t> g_playOut;  // persists during async playback
static int g_inRate = 16000;  // sample rate of received audio (from audio_out_start)
static bool g_recording = false;
static int64_t g_pressUs = 0;
static esp_websocket_client_handle_t g_ws = nullptr;

static int g_modeIdx = 0;
static const char* MODES[]   = {"general", "interview", "motivation"};
static const char* MODE_JP[] = {"相談", "面接", "志望動機"};

// Sample questions (used until mic STT/Whisper is added).
static const char* SAMPLES[] = {
    "就活、何から始めればいいですか？",
    "自己PRが苦手です。",
    "面接で緊張してしまいます。",
    "志望動機がうまく書けません。",
};
static int g_sampleIdx = 0;

static EventGroupHandle_t g_wifiEvents;
#define WIFI_CONNECTED_BIT BIT0

// Linear resample of mono PCM16 (e.g. server 16k -> device codec rate).
static std::vector<int16_t> resample16(const std::vector<int16_t>& in, int fromRate, int toRate) {
    if (fromRate == toRate || in.empty()) return in;
    size_t outN = (size_t)((uint64_t)in.size() * toRate / fromRate);
    std::vector<int16_t> out(outN);
    for (size_t i = 0; i < outN; i++) {
        double srcPos = (double)i * fromRate / toRate;
        size_t i0 = (size_t)srcPos;
        size_t i1 = (i0 + 1 < in.size()) ? i0 + 1 : in.size() - 1;
        double frac = srcPos - i0;
        out[i] = (int16_t)(in[i0] + (in[i1] - in[i0]) * frac);
    }
    return out;
}

// ---- drawing ----
// Static layer (logo + state): redrawn only on change. The reply text is a
// separate left-scrolling ticker animated every frame (animateTicker).
static int g_tickerX = 0;
static bool g_tickerInit = false;

static void drawStatic() {
    auto& d = GetHAL().getDisplay();
    int W = d.width(), H = d.height(), cx = W / 2;
    d.fillScreen(TFT_BLACK);
    bool hasCaption = !g_caption.empty();

    d.setSwapBytes(true);
#ifdef HAVE_LOGO
    if (hasCaption) {
        // Reply view: big logo on top, scrolling answer below (animateTicker).
        float z = 330.0f / logo_h;
        d.pushImageRotateZoom(cx, 30 + (logo_h * z) / 2.0f, logo_w / 2.0f,
                              logo_h / 2.0f, 0.0f, z, z, logo_w, logo_h, logo_data);
        // no state text here; the ticker carries the message
    } else {
        // Idle/connecting/disconnected: huge centered logo + state below.
        float z = 360.0f / logo_h;
        d.pushImageRotateZoom(cx, H / 2.0f - 10, logo_w / 2.0f, logo_h / 2.0f,
                              0.0f, z, z, logo_w, logo_h, logo_data);
        d.setFont(&fonts::lgfxJapanGothic_24);  // gothic (not mincho)
        d.setTextDatum(middle_center);
        d.setTextColor(0x9CDB);
        d.drawString(g_state.c_str(), cx, H - 54);  // inside the round edge
    }
#endif
    g_tickerInit = false;  // restart the ticker for the new caption
}

// Reply text scrolls right-to-left like a news ticker (round screen safe).
static void animateTicker() {
    if (g_caption.empty()) return;
    auto& d = GetHAL().getDisplay();
    int W = d.width();
    int bandY = 360, bandH = 58;  // below the reply logo, inside the round edge

    d.setFont(&fonts::lgfxJapanGothic_40);
    int tw = d.textWidth(g_caption.c_str());
    if (!g_tickerInit) { g_tickerX = W; g_tickerInit = true; }

    d.setClipRect(0, bandY, W, bandH);
    d.fillRect(0, bandY, W, bandH, TFT_BLACK);
    d.setTextDatum(middle_left);
    d.setTextColor(TFT_WHITE);
    d.drawString(g_caption.c_str(), g_tickerX, bandY + bandH / 2);
    d.clearClipRect();

    g_tickerX -= 6;
    if (g_tickerX < -tw - 20) g_tickerX = W;  // loop
}

static void setState(const char* s) { g_state = s; g_dirty = true; }

// ---- Wi-Fi ----
static void wifi_handler(void*, esp_event_base_t base, int32_t id, void*) {
    if (base == WIFI_EVENT && id == WIFI_EVENT_STA_START) esp_wifi_connect();
    else if (base == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED) esp_wifi_connect();
    else if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP)
        xEventGroupSetBits(g_wifiEvents, WIFI_CONNECTED_BIT);
}

static void wifi_connect() {
    g_wifiEvents = xEventGroupCreate();
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, wifi_handler, NULL, NULL);
    esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP, wifi_handler, NULL, NULL);

    wifi_config_t wc = {};
    strncpy((char*)wc.sta.ssid, WIFI_SSID, sizeof(wc.sta.ssid));
    strncpy((char*)wc.sta.password, WIFI_PASS, sizeof(wc.sta.password));
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wc));
    ESP_ERROR_CHECK(esp_wifi_start());
    xEventGroupWaitBits(g_wifiEvents, WIFI_CONNECTED_BIT, false, true, pdMS_TO_TICKS(20000));
}

// ---- WebSocket ----
static void wsSend(const char* json) {
    if (g_ws) esp_websocket_client_send_text(g_ws, json, strlen(json), portMAX_DELAY);
}

static void onJson(const char* data, int len) {
    cJSON* j = cJSON_ParseWithLength(data, len);
    if (!j) return;
    const char* type = cJSON_GetStringValue(cJSON_GetObjectItem(j, "type"));
    if (type) {
        if (!strcmp(type, "auth_ok")) {
            g_caption = "Aボタンで相談";
            setState("待機中");
        } else if (!strcmp(type, "state")) {
            const char* v = cJSON_GetStringValue(cJSON_GetObjectItem(j, "value"));
            if (v) {
                if (!strcmp(v, "thinking")) setState("考えています…");
                else if (!strcmp(v, "speaking")) setState("アドバイス中");
                else if (!strcmp(v, "idle")) setState("待機中");
            }
        } else if (!strcmp(type, "assistant_text")) {
            // Buffer the reply; it's revealed when playback starts (synced
            // with the voice), not before.
            const char* t = cJSON_GetStringValue(cJSON_GetObjectItem(j, "text"));
            if (t) g_pending += t;
        } else if (!strcmp(type, "audio_out_start")) {
            cJSON* sr = cJSON_GetObjectItem(j, "sample_rate");
            if (cJSON_IsNumber(sr)) g_inRate = sr->valueint;
            g_playbuf.clear();
        } else if (!strcmp(type, "audio_out_end")) {
            g_playPending = true;
        } else if (!strcmp(type, "error")) {
            const char* m = cJSON_GetStringValue(cJSON_GetObjectItem(j, "message"));
            g_caption = m ? m : "エラー";
            setState("エラー");
        } else if (!strcmp(type, "ping")) {
            wsSend("{\"type\":\"pong\"}");
        }
    }
    cJSON_Delete(j);
}

static void ws_handler(void*, esp_event_base_t, int32_t id, void* data) {
    auto* e = (esp_websocket_event_data_t*)data;
    switch (id) {
        case WEBSOCKET_EVENT_CONNECTED: {
            char hello[160];
            snprintf(hello, sizeof(hello),
                     "{\"type\":\"hello\",\"device_id\":\"%s\",\"device_token\":\"%s\"}",
                     DEVICE_ID, DEVICE_TOKEN);
            wsSend(hello);
            break;
        }
        case WEBSOCKET_EVENT_DATA:
            if (e->op_code == 0x2) {  // binary: PCM16 output chunk
                const int16_t* p = (const int16_t*)e->data_ptr;
                g_playbuf.insert(g_playbuf.end(), p, p + e->data_len / 2);
            } else if (e->op_code == 0x1 && e->data_len > 0) {  // text JSON
                onJson(e->data_ptr, e->data_len);
            }
            break;
        case WEBSOCKET_EVENT_DISCONNECTED:
            setState("切断・再接続中");
            break;
        default: break;
    }
}

// ---- app ----
extern "C" void app_main() {
    esp_err_t r = nvs_flash_init();
    if (r == ESP_ERR_NVS_NO_FREE_PAGES || r == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();
        nvs_flash_init();
    }

    GetHAL().init();
    GetHAL().setSpeakerVolume(255, true);  // loud
    drawStatic();

    wifi_connect();

    esp_websocket_client_config_t wcfg = {};
    wcfg.uri = SERVER_URI;
    g_ws = esp_websocket_client_init(&wcfg);
    esp_websocket_register_events(g_ws, WEBSOCKET_EVENT_ANY, ws_handler, NULL);
    esp_websocket_client_start(g_ws);

    for (;;) {
        GetHAL().updateButtonStates();

        // A button: tap = sample question; hold = push-to-talk (your voice).
        if (GetHAL().btnA.wasPressed()) g_pressUs = esp_timer_get_time();

        if (GetHAL().btnA.isPressed() && !g_recording &&
            esp_timer_get_time() - g_pressUs > 350000) {
            g_recording = true;
            g_caption = "";
            g_pending = "";
            GetHAL().vibrate(60);
            setState("聞いています…");
            wsSend("{\"type\":\"audio_in_start\",\"sample_rate\":16000,\"channels\":1,\"format\":\"pcm16\"}");
        }
        if (g_recording && GetHAL().btnA.isPressed()) {
            std::vector<int16_t> chunk;
            GetHAL().audioRecord(chunk, 100);  // 100ms at codec rate
            std::vector<int16_t> out = resample16(chunk, GetHAL().getAudioSampleRate(), 16000);
            if (!out.empty())
                esp_websocket_client_send_bin(g_ws, (const char*)out.data(),
                                              out.size() * 2, portMAX_DELAY);
        }
        if (GetHAL().btnA.wasReleased()) {
            if (g_recording) {
                g_recording = false;
                wsSend("{\"type\":\"audio_in_end\"}");
                setState("考えています…");
            } else {  // quick tap -> sample question (works without Whisper)
                GetHAL().vibrate(60);
                const char* q = SAMPLES[g_sampleIdx++ % (sizeof(SAMPLES) / sizeof(SAMPLES[0]))];
                g_caption = "";   // reply text appears with the voice, not now
                g_pending = "";
                char msg[256];
                snprintf(msg, sizeof(msg), "{\"type\":\"text_in\",\"text\":\"%s\"}", q);
                wsSend(msg);
                setState("考えています…");
            }
        }
        if (GetHAL().btnB.wasPressed()) {
            g_modeIdx = (g_modeIdx + 1) % 3;
            char msg[96];
            snprintf(msg, sizeof(msg), "{\"type\":\"mode_set\",\"value\":\"%s\"}", MODES[g_modeIdx]);
            wsSend(msg);
            g_dirty = true;
        }

        if (g_playPending) {
            g_playPending = false;
            int outRate = GetHAL().getAudioSampleRate();
            g_playOut = resample16(g_playbuf, g_inRate, outRate);
            g_playbuf.clear();
            GetHAL().vibrate(60);
            g_caption = g_pending;  // reveal text exactly as the voice starts
            g_pending.clear();
            setState("アドバイス中");
            // async so the loop keeps animating the ticker while speaking
            GetHAL().audioPlay(g_playOut, true);
        }

        if (g_dirty) { drawStatic(); g_dirty = false; }
        animateTicker();  // no-op when there is no caption
        vTaskDelay(pdMS_TO_TICKS(30));
    }
}
