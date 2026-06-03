// Audio helpers for the local voice pipeline (pure, offline-testable).
//   - WAV (PCM16) encode/decode for Whisper input and VOICEVOX output
//   - linear resampling between sample rates (e.g. VOICEVOX 24k -> device 16k)

// Wrap raw PCM16 little-endian samples in a canonical 44-byte WAV header.
export function encodeWav(pcm, sampleRate, channels = 1) {
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM fmt chunk size
  header.writeUInt16LE(1, 20); // audio format = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

// Parse a WAV buffer into { sampleRate, channels, bitsPerSample, pcm }.
// Scans chunks so it tolerates extra metadata before `data`.
export function decodeWav(buf) {
  if (buf.length < 12 || buf.toString('ascii', 0, 4) !== 'RIFF') {
    throw new Error('not a RIFF/WAV buffer');
  }
  let sampleRate = 0;
  let channels = 1;
  let bitsPerSample = 16;
  let offset = 12; // past RIFF....WAVE
  let pcm = null;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      channels = buf.readUInt16LE(body + 2);
      sampleRate = buf.readUInt32LE(body + 4);
      bitsPerSample = buf.readUInt16LE(body + 14);
    } else if (id === 'data') {
      pcm = buf.subarray(body, body + size);
    }
    offset = body + size + (size % 2); // chunks are word-aligned
  }
  if (!pcm) throw new Error('no data chunk in WAV');
  return { sampleRate, channels, bitsPerSample, pcm };
}

// Resample mono PCM16 via linear interpolation. Returns a new Buffer.
export function resamplePcm16(pcm, fromRate, toRate) {
  if (fromRate === toRate) return pcm;
  const inSamples = Math.floor(pcm.length / 2);
  const ratio = toRate / fromRate;
  const outSamples = Math.max(0, Math.floor(inSamples * ratio));
  const out = Buffer.alloc(outSamples * 2);
  for (let i = 0; i < outSamples; i++) {
    const srcPos = i / ratio;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(i0 + 1, inSamples - 1);
    const frac = srcPos - i0;
    const s0 = pcm.readInt16LE(i0 * 2);
    const s1 = pcm.readInt16LE(i1 * 2);
    out.writeInt16LE(Math.round(s0 + (s1 - s0) * frac), i * 2);
  }
  return out;
}

// Apply a linear gain to PCM16 in place, clamped to the int16 range.
export function applyGain(pcm, gain) {
  if (!gain || gain === 1) return pcm;
  for (let i = 0; i + 1 < pcm.length; i += 2) {
    let v = Math.round(pcm.readInt16LE(i) * gain);
    if (v > 32767) v = 32767;
    else if (v < -32768) v = -32768;
    pcm.writeInt16LE(v, i);
  }
  return pcm;
}

// Downmix interleaved stereo PCM16 to mono (averages channels).
export function toMono(pcm, channels) {
  if (channels <= 1) return pcm;
  const frames = Math.floor(pcm.length / (2 * channels));
  const out = Buffer.alloc(frames * 2);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) sum += pcm.readInt16LE((f * channels + c) * 2);
    out.writeInt16LE(Math.round(sum / channels), f * 2);
  }
  return out;
}
