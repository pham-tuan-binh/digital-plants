/**
 * The film's sound.
 *
 * Every rewrite in the score carries a cue — when it happens, what pitch it
 * starts on, how far that pitch climbs, how long it rings. This turns that
 * list into a stereo track. It is pure arithmetic over a sample buffer: no
 * audio library, no recordings, and the same cues always give the same file.
 */

const RATE = 48_000;

/**
 * One droplet.
 *
 * A short blip whose pitch climbs while it sounds. A falling pitch reads as
 * wood, a flat one as a machine; a rising one is what a bubble leaving water
 * does, and it is the only part of this that makes the sound read as alive.
 * Under it sits a much quieter half-frequency body with a longer tail, which
 * is what gives the blip somewhere to have come from, and in front of it a
 * two-millisecond speck of noise for the wetness of the attack.
 */
function droplet(left, right, at, cue, rand) {
  const start = Math.round(at * RATE);
  const tau = cue.dur * 0.3;
  const span = Math.ceil(cue.dur * 2.4 * RATE);
  const hz = cue.hz * (1 + (rand() - 0.5) * 0.02);
  const climb = Math.log(cue.sweep) / cue.dur;
  // A touch off centre, so a run of them has some width to it.
  const pan = (rand() - 0.5) * 0.4;

  for (let i = 0; i < span; i++) {
    const n = start + i;
    if (n < 0) continue;
    if (n >= left.length) break;
    const t = i / RATE;

    // Phase of an exponential sweep is the integral of the frequency.
    const phase = (2 * Math.PI * hz * (Math.exp(climb * t) - 1)) / climb;
    const attack = 1 - Math.exp(-t / 0.0016);
    const env = attack * Math.exp(-t / tau);

    let v = Math.sin(phase) * 0.9 + Math.sin(2 * phase + 0.6) * 0.15;
    v += (rand() * 2 - 1) * 0.16 * Math.exp(-t / 0.0026);
    v *= env;
    v +=
      Math.sin(2 * Math.PI * hz * 0.5 * t) *
      0.2 *
      attack *
      Math.exp(-t / (tau * 2.4));
    v *= cue.gain;

    left[n] += v * (1 - pan);
    right[n] += v * (1 + pan);
  }
}

/** A 16-bit stereo WAV of the whole film's sound. */
export function soundtrack(cues, seconds) {
  const n = Math.ceil((seconds + 1) * RATE);
  const left = new Float32Array(n);
  const right = new Float32Array(n);

  // Deterministic, like everything else here.
  let a = 20_240_121 >>> 0;
  const rand = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (const cue of cues) droplet(left, right, cue.frame / 30, cue, rand);

  // Room tone: noise rolled off hard and set almost below hearing, so the
  // track is quiet rather than dead. Digital silence between the drops reads
  // as a broken file.
  let lp = 0;
  for (let i = 0; i < n; i++) {
    lp += ((rand() * 2 - 1) - lp) * 0.02;
    left[i] += lp * 0.0045;
    right[i] += lp * 0.0045;
  }

  let peak = 0;
  for (let i = 0; i < n; i++) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  const gain = peak > 0 ? 0.72 / peak : 1;

  const bytes = Buffer.alloc(44 + n * 4);
  bytes.write("RIFF", 0);
  bytes.writeUInt32LE(36 + n * 4, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20); // PCM
  bytes.writeUInt16LE(2, 22); // stereo
  bytes.writeUInt32LE(RATE, 24);
  bytes.writeUInt32LE(RATE * 4, 28);
  bytes.writeUInt16LE(4, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(n * 4, 40);

  const clip = (v) => Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
  for (let i = 0; i < n; i++) {
    bytes.writeInt16LE(clip(left[i] * gain), 44 + i * 4);
    bytes.writeInt16LE(clip(right[i] * gain), 46 + i * 4);
  }
  return bytes;
}
