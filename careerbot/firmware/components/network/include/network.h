// network: Wi-Fi + WebSocket client to the relay server
// (spec Task 2/3, 12.2 network). JSON control + binary audio frames.
#pragma once
#include <stddef.h>
#include <stdint.h>

void network_init(void);

// Long-running task: maintains Wi-Fi + WebSocket connection with reconnect.
void network_task(void *arg);

// Send a JSON control message (e.g. hello, audio_in_start, mode_set).
void network_send_json(const char *json);

// Send a binary PCM16 audio chunk (during a listening turn).
void network_send_audio(const uint8_t *pcm, size_t len);

bool network_is_connected(void);
