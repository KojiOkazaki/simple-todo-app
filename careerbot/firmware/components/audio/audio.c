// audio — MVP scaffold. TODO(Task 4/5): real I2S MIC + speaker via esp_codec_dev.
#include "audio.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const char *TAG = "audio";
static bool s_capture_enabled = false;

void audio_init(void) {
    ESP_LOGI(TAG, "audio init (%d Hz, %d ch)", AUDIO_SAMPLE_RATE, AUDIO_CHANNELS);
    // TODO: i2s_channel for MIC + speaker; allocate PSRAM ring buffers.
}

void audio_capture_task(void *arg) {
    (void)arg;
    for (;;) {
        if (s_capture_enabled) {
            // TODO: read I2S, chunk PCM16, forward to network_send_audio().
        }
        vTaskDelay(pdMS_TO_TICKS(20));
    }
}

void audio_playback_task(void *arg) {
    (void)arg;
    for (;;) {
        // TODO: pop from playback queue and write to I2S speaker.
        vTaskDelay(pdMS_TO_TICKS(20));
    }
}

void audio_play_chunk(const uint8_t *pcm, size_t len) {
    (void)pcm; (void)len;
    // TODO: enqueue into playback queue.
}

void audio_set_capture_enabled(bool enabled) {
    s_capture_enabled = enabled;
    ESP_LOGI(TAG, "capture %s", enabled ? "on" : "off");
}
