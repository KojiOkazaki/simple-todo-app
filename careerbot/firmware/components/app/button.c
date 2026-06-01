// button input — debounced GPIO polling (spec Task 1).
// Real implementation: configures A/B GPIOs as inputs with pull-ups and
// reports clean press edges to the app state machine.

#include "button.h"
#include "app.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "button";

#define DEBOUNCE_MS 30
#define POLL_MS     10

static int s_last_a = !CAREERBOT_BTN_ACTIVE_LEVEL;
static int s_last_b = !CAREERBOT_BTN_ACTIVE_LEVEL;

void button_init(void) {
    gpio_config_t io = {
        .pin_bit_mask = (1ULL << CAREERBOT_BTN_A_GPIO) |
                        (1ULL << CAREERBOT_BTN_B_GPIO),
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = (CAREERBOT_BTN_ACTIVE_LEVEL == 0)
                          ? GPIO_PULLUP_ENABLE : GPIO_PULLUP_DISABLE,
        .pull_down_en = (CAREERBOT_BTN_ACTIVE_LEVEL == 1)
                          ? GPIO_PULLDOWN_ENABLE : GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE,
    };
    gpio_config(&io);
    ESP_LOGI(TAG, "button init (A=%d, B=%d)", CAREERBOT_BTN_A_GPIO, CAREERBOT_BTN_B_GPIO);
}

// Returns 1 on a debounced active-edge (release->press) for the given pin.
static int read_edge(int gpio, int *last) {
    int level = gpio_get_level(gpio);
    int pressed = (level == CAREERBOT_BTN_ACTIVE_LEVEL);
    int was_pressed = (*last == CAREERBOT_BTN_ACTIVE_LEVEL);
    *last = level;
    return (pressed && !was_pressed) ? 1 : 0;
}

void button_task(void *arg) {
    (void)arg;
    int stable_a = 0, stable_b = 0;
    for (;;) {
        // Simple integrate-and-confirm debounce.
        if (read_edge(CAREERBOT_BTN_A_GPIO, &s_last_a)) stable_a = DEBOUNCE_MS / POLL_MS;
        if (read_edge(CAREERBOT_BTN_B_GPIO, &s_last_b)) stable_b = DEBOUNCE_MS / POLL_MS;

        if (stable_a > 0 && --stable_a == 0) app_on_button_a();
        if (stable_b > 0 && --stable_b == 0) app_on_button_b();

        vTaskDelay(pdMS_TO_TICKS(POLL_MS));
    }
}
