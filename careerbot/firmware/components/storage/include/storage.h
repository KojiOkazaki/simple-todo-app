// storage: NVS-backed settings (spec Task 2, 12.2 storage).
// Persists Wi-Fi creds, device_id, backend_url, privacy prefs.
#pragma once
#include <stddef.h>

void storage_init(void);

// Returns 0 on success, fills buf (NUL-terminated). Empty if unset.
int storage_get(const char *key, char *buf, size_t buf_len);
int storage_set(const char *key, const char *value);

// Common keys.
#define STORAGE_KEY_WIFI_SSID  "wifi_ssid"
#define STORAGE_KEY_WIFI_PASS  "wifi_pass"
#define STORAGE_KEY_DEVICE_ID  "device_id"
#define STORAGE_KEY_BACKEND_URL "backend_url"
#define STORAGE_KEY_DEVICE_TOKEN "device_token"
