// ui: screen states + subtitles, maps app state to display (spec 8, Task 6).
#pragma once

typedef enum {
    UI_STATE_BOOT = 0,    // 起動: ロゴ + "CareerBot 起動中…"
    UI_STATE_IDLE,        // 待機: "ボタンを押して相談開始"
    UI_STATE_LISTENING,   // 聞いています… + 波形
    UI_STATE_THINKING,    // 考えています…
    UI_STATE_SPEAKING,    // アドバイス中 + 字幕
    UI_STATE_ERROR,       // エラー画面
} ui_state_t;

void ui_init(void);
void ui_task(void *arg);
void ui_show_state(ui_state_t state);

// Update the on-screen subtitle while speaking (assistant_text).
void ui_set_subtitle(const char *text);

// Show an error message (Wi-Fi/server/audio/API).
void ui_show_error(const char *message);
