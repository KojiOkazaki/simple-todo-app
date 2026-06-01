// button: physical button input for StopWatch (spec Task 1, 8.2).
//   A = 会話開始 / Push-to-talk   B = モード切替
// Debounced polling on a FreeRTOS task; edges are dispatched to the app
// state machine (app_on_button_a / app_on_button_b).
#pragma once

// GPIOs are board-specific; override via build flags if your StopWatch
// wiring differs. These are placeholders — confirm against the board pinout.
#ifndef CAREERBOT_BTN_A_GPIO
#define CAREERBOT_BTN_A_GPIO 37
#endif
#ifndef CAREERBOT_BTN_B_GPIO
#define CAREERBOT_BTN_B_GPIO 39
#endif

// Buttons are active-low with internal pull-ups by default.
#ifndef CAREERBOT_BTN_ACTIVE_LEVEL
#define CAREERBOT_BTN_ACTIVE_LEVEL 0
#endif

void button_init(void);

// FreeRTOS task: polls + debounces buttons and emits app events.
void button_task(void *arg);
