// ui — MVP scaffold. TODO(Task 6): render each state via display + LVGL,
// animate listening waveform, scroll subtitle, trigger vibration feedback.
#include "ui.h"
#include "display.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "ui";

static const char *label_for(ui_state_t s) {
    switch (s) {
        case UI_STATE_BOOT:      return "CareerBot 起動中…";
        case UI_STATE_IDLE:      return "待機中 / ボタンを押して相談開始";
        case UI_STATE_LISTENING: return "聞いています…";
        case UI_STATE_THINKING:  return "考えています…";
        case UI_STATE_SPEAKING:  return "アドバイス中…";
        case UI_STATE_ERROR:     return "エラー";
        default:                  return "";
    }
}

void ui_init(void) { ESP_LOGI(TAG, "ui init"); }

void ui_task(void *arg) {
    (void)arg;
    for (;;) {
        // TODO: handle LVGL tick + animations.
        vTaskDelay(pdMS_TO_TICKS(33));
    }
}

void ui_show_state(ui_state_t state) {
    display_draw_logo();
    display_draw_status(label_for(state), NULL);
}

void ui_set_subtitle(const char *text) {
    display_draw_status(label_for(UI_STATE_SPEAKING), text);
}

void ui_show_error(const char *message) {
    display_draw_status("エラー", message);
}
