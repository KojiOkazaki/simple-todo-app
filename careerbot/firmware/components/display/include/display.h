// display: AMOLED panel init + low-level draw (spec Task 1/6, 12.2 display).
// Higher-level screens (logo, status, subtitle) live in `ui`.
#pragma once

void display_init(void);
void display_clear(void);

// Draw the CAREERBOT logo (assets/logo) centered.
void display_draw_logo(void);

// Draw a status line and an optional subtitle/caption.
void display_draw_status(const char *status, const char *subtitle);
