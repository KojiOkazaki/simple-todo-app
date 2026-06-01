// network — MVP scaffold.
// TODO(Task 2): esp_wifi STA from NVS creds, retry/backoff, status callback.
// TODO(Task 3): esp_websocket_client connect to backend_url + /ws, parse
//               JSON control (api.md) + dispatch binary audio_out to audio.
#include "network.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "network";
static bool s_connected = false;

void network_init(void) {
    ESP_LOGI(TAG, "network init");
}

void network_task(void *arg) {
    (void)arg;
    for (;;) {
        // TODO: ensure Wi-Fi up -> ensure WS up -> send hello -> pump events.
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

void network_send_json(const char *json) {
    (void)json;
    // TODO: esp_websocket_client_send_text
}

void network_send_audio(const uint8_t *pcm, size_t len) {
    (void)pcm; (void)len;
    // TODO: esp_websocket_client_send_bin
}

bool network_is_connected(void) { return s_connected; }
