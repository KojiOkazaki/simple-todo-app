// storage — MVP scaffold. TODO(Task 2): back with nvs_flash get/set_str.
#include "storage.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "storage";

void storage_init(void) {
    ESP_LOGI(TAG, "storage init (nvs)");
    // TODO: nvs_flash_init() + open namespace "careerbot".
}

int storage_get(const char *key, char *buf, size_t buf_len) {
    (void)key;
    if (buf && buf_len) buf[0] = '\0';
    // TODO: nvs_get_str
    return 0;
}

int storage_set(const char *key, const char *value) {
    (void)key; (void)value;
    // TODO: nvs_set_str + nvs_commit
    return 0;
}
