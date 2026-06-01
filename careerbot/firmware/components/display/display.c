// display — MVP scaffold. TODO(Task 1/6): init AMOLED panel + draw via LVGL.
//
// Logo: generate logo_img.c with `scripts/png_to_c.py`, add it to this
// component's SRCS, and build with -DCAREERBOT_HAS_LOGO=1. Then
// display_draw_logo() blits the RGB565 image centered.
#include "display.h"
#include "esp_log.h"

static const char *TAG = "display";

#if CAREERBOT_HAS_LOGO
extern const uint16_t careerbot_logo_w;
extern const uint16_t careerbot_logo_h;
extern const uint16_t careerbot_logo_data[];
#endif

void display_init(void) { ESP_LOGI(TAG, "display init"); }
void display_clear(void) { /* TODO: fill panel with background color */ }

void display_draw_logo(void) {
#if CAREERBOT_HAS_LOGO
    // TODO: blit careerbot_logo_data (careerbot_logo_w x careerbot_logo_h)
    //       centered to the panel framebuffer.
    ESP_LOGI(TAG, "draw logo %dx%d", careerbot_logo_w, careerbot_logo_h);
#else
    ESP_LOGI(TAG, "draw logo (placeholder; generate logo_img.c)");
#endif
}

void display_draw_status(const char *status, const char *subtitle) {
    ESP_LOGI(TAG, "status: %s | %s", status ? status : "", subtitle ? subtitle : "");
}
