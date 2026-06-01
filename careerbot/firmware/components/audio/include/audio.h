// audio: MIC capture (I2S) + speaker playback (spec Task 4/5, 12.2 audio).
// PCM16 mono at 16kHz (see backend AUDIO_SAMPLE_RATE).
#pragma once
#include <stddef.h>
#include <stdint.h>

#define AUDIO_SAMPLE_RATE 16000
#define AUDIO_CHANNELS    1

void audio_init(void);

// Capture task: reads MIC, chunks PCM16, hands chunks to network (when listening).
void audio_capture_task(void *arg);

// Playback task: pulls PCM16 chunks from the playback queue and plays them.
void audio_playback_task(void *arg);

// Enqueue a received output-audio chunk for playback.
void audio_play_chunk(const uint8_t *pcm, size_t len);

// Gate capture (half-duplex: stop recording while speaking).
void audio_set_capture_enabled(bool enabled);
