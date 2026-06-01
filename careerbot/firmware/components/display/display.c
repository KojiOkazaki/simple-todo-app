// display — MVP scaffold. TODO(Task 1/6): init AMOLED panel + draw via LVGL.
#include "display.h"
#include "esp_log.h"

static const char *TAG = "display";

void display_init(void) { ESP_LOGI(TAG, "display init"); }
void display_clear(void) { /* TODO */ }
void display_draw_logo(void) { ESP_LOGI(TAG, "draw logo"); }
void display_draw_status(const char *status, const char *subtitle) {
    ESP_LOGI(TAG, "status: %s | %s", status ? status : "", subtitle ? subtitle : "");
}
