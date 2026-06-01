#!/usr/bin/env bash
# Add a direct streaming-write (Hal::audioWrite -> esp_codec_dev_write) to the
# M5StopWatch-UserDemo HAL, so audio can be streamed in chunks instead of
# buffering the whole clip (which OOMs/watchdog-reboots on long audio).
#
# Run from the demo root:  bash add_audiowrite.sh
# Idempotent: safe to run more than once.
set -euo pipefail
cd "${1:-.}"

H=main/hal/hal.h
C=main/hal/hal_audio.cpp
[ -f "$H" ] && [ -f "$C" ] || { echo "Run from the M5StopWatch-UserDemo root (main/hal/* not found)"; exit 1; }

grep -q 'void audioWrite' "$H" || perl -0pi -e \
 's/(void audioPlay\(std::vector<int16_t>& data, bool async = true\);)/$1\n    void audioWrite(const int16_t* data, size_t samples);/' "$H"

grep -q 'writeChunk' "$C" || perl -0pi -e \
 's/(    void play\(std::vector<int16_t>& data, bool async\)\n)/    void writeChunk(const int16_t* p, size_t n)\n    {\n        std::lock_guard<std::mutex> lock(_mutex);\n        esp_codec_dev_write(_codec_dev, (void*)p, n * sizeof(int16_t));\n    }\n\n$1/' "$C"

grep -q 'Hal::audioWrite' "$C" || perl -0pi -e \
 's/(void Hal::audioPlay\(std::vector<int16_t>& data, bool async\)\n\{\n    _audio_codec\.play\(data, async\);\n\}\n)/$1\nvoid Hal::audioWrite(const int16_t* data, size_t samples)\n{\n    _audio_codec.writeChunk(data, samples);\n}\n/' "$C"

echo "Applied. Verification (expect 4 lines):"
grep -n 'audioWrite\|writeChunk' "$H" "$C"
