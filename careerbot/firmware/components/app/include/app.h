// app: device state machine + event orchestration (spec Task 6, 12.2 app).
// Consumes UI/button events and server events; drives UI + audio + network.
#pragma once

typedef enum {
    APP_STATE_IDLE = 0,   // 待機中
    APP_STATE_LISTENING,  // 聞いています
    APP_STATE_THINKING,   // 考えています
    APP_STATE_SPEAKING,   // アドバイス中
    APP_STATE_ERROR,      // エラー
} app_state_t;

typedef enum {
    APP_MODE_GENERAL = 0, // 通常相談
    APP_MODE_INTERVIEW,   // 面接練習
    APP_MODE_MOTIVATION,  // 志望動機
} app_mode_t;

void app_init(void);

// FreeRTOS task: consumes the app event queue and applies state transitions.
void app_state_task(void *arg);

// Event injectors (called from ISR-safe wrappers / other tasks).
void app_on_button_a(void);     // push-to-talk
void app_on_button_b(void);     // cycle mode
void app_on_server_state(app_state_t state);

app_state_t app_get_state(void);
app_mode_t  app_get_mode(void);
