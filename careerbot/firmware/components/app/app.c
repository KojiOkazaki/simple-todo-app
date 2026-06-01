// app state machine — MVP scaffold.
// TODO(Task 6): wire to real UI/audio/network calls and a FreeRTOS queue.

#include "app.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "app";
static app_state_t s_state = APP_STATE_IDLE;
static app_mode_t  s_mode  = APP_MODE_GENERAL;

void app_init(void) {
    s_state = APP_STATE_IDLE;
    s_mode = APP_MODE_GENERAL;
    ESP_LOGI(TAG, "app init (mode=general)");
}

void app_state_task(void *arg) {
    (void)arg;
    for (;;) {
        // TODO: block on app event queue; for now idle heartbeat.
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void app_on_button_a(void) {
    // Push-to-talk toggle: idle -> listening, listening -> end-of-turn.
    // TODO: vibrate short once; send audio_in_start / audio_in_end.
    ESP_LOGI(TAG, "button A (push-to-talk)");
}

void app_on_button_b(void) {
    s_mode = (app_mode_t)((s_mode + 1) % 3);
    ESP_LOGI(TAG, "mode -> %d", s_mode);
    // TODO: send mode_set to server.
}

void app_on_server_state(app_state_t state) {
    s_state = state;
    // TODO: ui_show_state(...) mapping.
}

app_state_t app_get_state(void) { return s_state; }
app_mode_t  app_get_mode(void)  { return s_mode; }
