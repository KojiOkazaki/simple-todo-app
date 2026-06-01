// CareerBot firmware entry point.
//
// Brings up the FreeRTOS tasks described in spec section 19 and wires the
// app state machine to the device subsystems. This is an MVP scaffold:
// each subsystem exposes a documented interface (components/*/include) with
// stub implementations to be filled in per Task 1-6.

#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "app.h"
#include "audio.h"
#include "display.h"
#include "network.h"
#include "storage.h"
#include "ui.h"

static const char *TAG = "careerbot";

void app_main(void) {
    ESP_LOGI(TAG, "CareerBot booting...");

    // Persistent settings (Wi-Fi creds, device_id, backend_url) from NVS.
    storage_init();

    // Display + splash (CAREERBOT logo).
    display_init();
    ui_init();
    ui_show_state(UI_STATE_BOOT);

    // Subsystems.
    audio_init();
    network_init();

    // App state machine owns transitions idle->listening->thinking->speaking.
    app_init();

    // Spawn the long-running tasks (priorities are indicative).
    xTaskCreate(network_task,         "network",  4096, NULL, 5, NULL);
    xTaskCreate(audio_capture_task,   "audio_in", 4096, NULL, 6, NULL);
    xTaskCreate(audio_playback_task,  "audio_out",4096, NULL, 6, NULL);
    xTaskCreate(ui_task,              "ui",       4096, NULL, 4, NULL);
    xTaskCreate(app_state_task,       "app",      4096, NULL, 5, NULL);

    ESP_LOGI(TAG, "CareerBot ready");
}
