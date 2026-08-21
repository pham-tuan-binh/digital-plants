/**
 * The score: what is on screen, frame by frame.
 *
 * The film is cut in frames rather than seconds because it is photographed a
 * frame at a time, not played. Nothing here reads a clock — given a frame
 * number, this works out which shot it falls in and how far through, and the
 * page draws exactly that. Two runs of the capture are then identical, and a
 * slow machine makes a slow capture rather than a stuttering film.
 */

import { FLORA, growFlora, type Flora } from "@/lib/flora";
import { derive, interpret, parseRules, type Drawing } from "@/lib/lsystem";
import { ladder, type Pass } from "./derivation";

export const FPS = 30;

/** Five species, chosen so that no two are built on the same idea. */
const CAST = ["mai", "phuong", "giay", "su", "huongduong"];

const TITLE = 126; // 4.2s
const INTRO = 12; //  the name, before the derivation starts
const PER_PASS = 13; // 0.43s a rewrite — quick, but you can read it
const HOLD = 16; //   the finished plant, before the cut
const BED = 101; // 3.4s

/** How much of a pass is spent marking the letters that are about to go. */
export const STRUCK = 0.42;

/** One generation: the word, and the plant that word draws. */
export type Rung = {
  word: string;
  drawing: Drawing;
  /** How many strokes the turtle laid down for it. */
  segments: number;
};

export type Movement = {
  plant: Flora;
  /** The seed the specimen was actually grown from. */
  seed: number;
  rungs: Rung[];
  passes: Pass[];
};

export type Shot =
  | { kind: "title"; start: number; length: number }
  | { kind: "flora"; start: number; length: number; index: number; movement: Movement }
  | { kind: "bed"; start: number; length: number };

/**
 * Grow one species, and keep every generation on the way.
 *
 * Each generation is drawn inside the *last* generation's bounds rather than
 * its own. A plate on the site fits each figure to its own frame, which is
 * right for a figure read on its own; here it would make the plant lurch and
 * rescale at every pass. Held to one frame instead, the early generations sit
 * small at the foot of it and the plant grows up into the picture, which is
 * what is actually happening.
 */
function movement(plant: Flora): Movement {
  const grown = growFlora(plant, plant.seed);
  const { words, passes } = ladder(
    plant.axiom,
    plant.rules,
    plant.steps,
    grown.seed,
  );

  const drawn = words.map((word) =>
    interpret(word, {
      step: 1,
      budget: 12_000,
      seed: grown.seed,
      ...plant.turtle,
    }),
  );
  const frame = drawn[drawn.length - 1].bounds;

  const rungs = drawn.map((d, i) => ({
    word: words[i],
    drawing: { ...d, bounds: frame },
    segments: d.segments.length,
  }));

  return { plant, seed: grown.seed, rungs, passes };
}

export const MOVEMENTS: Movement[] = CAST.map((id) => {
  const plant = FLORA.find((f) => f.id === id);
  if (!plant) throw new Error(`no flora called ${id}`);
  return movement(plant);
});

/** Every species, grown whole, for the plate at the end. */
export const BOUQUET: { plant: Flora; drawing: Drawing; seed: number }[] =
  FLORA.map((plant) => {
    const grown = growFlora(plant, plant.seed);
    return {
      plant,
      seed: grown.seed,
      drawing: interpret(grown.word, {
        step: 1,
        budget: 12_000,
        seed: grown.seed,
        ...plant.turtle,
      }),
    };
  });

export const SHOTS: Shot[] = (() => {
  const out: Shot[] = [];
  let at = 0;

  out.push({ kind: "title", start: at, length: TITLE });
  at += TITLE;

  MOVEMENTS.forEach((m, index) => {
    const length = INTRO + m.passes.length * PER_PASS + HOLD;
    out.push({ kind: "flora", start: at, length, index, movement: m });
    at += length;
  });

  out.push({ kind: "bed", start: at, length: BED });
  at += BED;

  return out;
})();

export const FRAMES = SHOTS[SHOTS.length - 1].start + SHOTS[SHOTS.length - 1].length;

export function shotAt(frame: number): { shot: Shot; local: number } {
  const f = Math.max(0, Math.min(FRAMES - 1, Math.round(frame)));
  for (const shot of SHOTS) {
    if (f < shot.start + shot.length) return { shot, local: f - shot.start };
  }
  const last = SHOTS[SHOTS.length - 1];
  return { shot: last, local: last.length - 1 };
}

/** Where a flora shot has got to: which word is up, and how much is drawn. */
export type Beat = {
  /** Index of the generation whose word is on the page. */
  n: number;
  rung: Rung;
  /** The pass being shown, or null while the axiom or the finished plant is. */
  pass: Pass | null;
  /** True while the letters that are about to go are marked. */
  striking: boolean;
  /** How many strokes of `rung` to lay down. */
  reveal: number;
  /** 0 at the cut, 1 once the titling has settled. */
  opened: number;
};

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export function beatAt(m: Movement, local: number): Beat {
  const opened = ease(clamp01(local / INTRO));
  const passes = m.passes.length;

  if (local < INTRO) {
    return {
      n: 0,
      rung: m.rungs[0],
      pass: null,
      striking: false,
      reveal: m.rungs[0].segments,
      opened,
    };
  }

  const into = local - INTRO;
  const k = Math.floor(into / PER_PASS);

  if (k >= passes) {
    const last = m.rungs[m.rungs.length - 1];
    return {
      n: m.rungs.length - 1,
      rung: last,
      pass: null,
      striking: false,
      reveal: last.segments,
      opened: 1,
    };
  }

  const u = (into % PER_PASS) / PER_PASS;
  if (u < STRUCK) {
    return {
      n: k,
      rung: m.rungs[k],
      pass: m.passes[k],
      striking: true,
      reveal: m.rungs[k].segments,
      opened,
    };
  }

  // The new word is up; the plant grows into the strokes it added.
  const grown = ease(clamp01((u - STRUCK) / (1 - STRUCK)));
  const before = Math.min(m.rungs[k].segments, m.rungs[k + 1].segments);
  const after = m.rungs[k + 1].segments;
  return {
    n: k + 1,
    rung: m.rungs[k + 1],
    pass: m.passes[k],
    striking: false,
    reveal: Math.round(before + (after - before) * grown),
    opened,
  };
}

/** The opening plant: the one the book itself opens with. */
export const HERO = (() => {
  const { rules } = parseRules("X -> F[+X][-X]FX\nF -> FF");
  const gens = derive("X", rules, 5);
  return interpret(gens[gens.length - 1] ?? "", {
    angle: 25.7,
    step: 1,
    budget: 8000,
  });
})();
