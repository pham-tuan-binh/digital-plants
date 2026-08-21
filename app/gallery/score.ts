/**
 * The gallery: every species on one sheet, all growing at once.
 *
 * The same arithmetic as the film — given a frame number this says exactly
 * how much of each plant is down — but with no derivation on the page and
 * nothing cut. Fifteen plates come up together and fill in at their own
 * rates, and each is named once it has finished.
 */

import { GARDEN, TET, growFlora, type Flora } from "@/lib/flora";
import { interpret, mulberry32, type Drawing } from "@/lib/lsystem";

export const FPS = 30;

/** Every species, in the book's own order: the garden, then the Tết trees. */
const CAST: Flora[] = [...GARDEN, ...TET];

export type Specimen = {
  plant: Flora;
  drawing: Drawing;
  seed: number;
  /** The frame the first stroke goes down on. */
  from: number;
  /** How many frames the whole plant takes to draw. */
  span: number;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export const SPECIMENS: Specimen[] = (() => {
  const rand = mulberry32(31);

  return CAST.map((plant) => {
    const grown = growFlora(plant, plant.seed);
    const drawing = interpret(grown.word, {
      step: 1,
      budget: 12_000,
      seed: grown.seed,
      ...plant.turtle,
    });

    // How long a plant takes is mostly how much of it there is. A tuft of
    // grass is fifteen strokes and is over almost as soon as it starts; an
    // apricot is eleven hundred and is still filling in when everything
    // around it has finished, which is the truer thing to watch anyway.
    const span = clamp(110 + drawing.segments.length * 0.33, 150, 470);

    return {
      plant,
      drawing,
      seed: grown.seed,
      from: Math.round(4 + rand() * 30),
      span: Math.round(span * (0.92 + rand() * 0.16)),
    };
  });
})();

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/** The last frame anything is still being drawn on, plus a while to look. */
export const FRAMES = (() => {
  const done = Math.max(...SPECIMENS.map((s) => s.from + s.span));
  return done + 170;
})();

/** How much of one specimen is down, and how far up its name is. */
export function growthAt(s: Specimen, frame: number) {
  const t = ease(clamp01((frame - s.from) / s.span));
  return {
    reveal: Math.round(t * s.drawing.segments.length),
    // The name is written under it as it finishes, not before.
    named: ease(clamp01((frame - s.from - s.span * 0.78) / 26)),
  };
}

/* ----------------------------------------------------------------- sound -- */

export type Cue = {
  frame: number;
  hz: number;
  sweep: number;
  dur: number;
  gain: number;
};

const PENTA = [0, 2, 4, 7, 9];

/**
 * A droplet as each plant finishes.
 *
 * They are done at very different moments, so what would be a chord if they
 * all took the same time comes out as scattered rain instead.
 */
export const CUES: Cue[] = (() => {
  const rand = mulberry32(17);

  const cues: Cue[] = [
    { frame: 2, hz: 150, sweep: 1.05, dur: 0.4, gain: 0.36 },
  ];

  SPECIMENS.forEach((s, i) => {
    const step = PENTA[i % PENTA.length] + 12 * (i % 3 === 2 ? 1 : 0);
    cues.push({
      frame: s.from + s.span,
      hz: 262 * Math.pow(2, step / 12) * (1 + (rand() - 0.5) * 0.03),
      sweep: 1.45 + rand() * 0.55,
      dur: 0.08 + rand() * 0.05,
      gain: 0.42 + rand() * 0.18,
    });
  });

  return cues.sort((a, b) => a.frame - b.frame);
})();
