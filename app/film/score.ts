/**
 * The score: what is on screen, frame by frame.
 *
 * The film is cut in frames rather than seconds because it is photographed a
 * frame at a time, not played. Nothing here reads a clock — given a frame
 * number, this works out which shot it falls in and how far through, and the
 * page draws exactly that. Two runs of the capture are then identical, and a
 * slow machine makes a slow capture rather than a stuttering film.
 */

import { FLORA, GARDEN, TET, growFlora, type Flora } from "@/lib/flora";
import {
  derive,
  interpret,
  mulberry32,
  parseRules,
  type Drawing,
} from "@/lib/lsystem";
import { ladder, type Pass } from "./derivation";

export const FPS = 30;

/** Five species, chosen so that no two are built on the same idea. */
const CAST = ["mai", "phuong", "giay", "su", "huongduong"];

const TITLE = 159; // 5.3s — the landing page of the book, and its epigraph
const INTRO = 12; //   the name, before the derivation starts
const PER_PASS = 11; // 0.37s a rewrite — quick, but you can read it
const HOLD = 12; //    the finished plant, before the cut
/**
 * The flip: the rest of the flora, one plate at a time.
 *
 * A sheet of all fifteen at once is a contents page — you see everything
 * there is to see in the first quarter second and then wait for it to end.
 * Turned over one at a time, each one is a small surprise, and the film has
 * somewhere to go right up to the last frame.
 */
const PER_PLATE = 10;
/** The last plate is held a beat longer, and then the film is simply over. */
const LAST = 20;

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
  | { kind: "flip"; start: number; length: number; each: number };

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

/**
 * Every species, grown whole, for the flip at the end.
 *
 * In the book's own order, which is the garden first and the two Tết trees
 * last — so the film finishes where the book does, on a branch of đào.
 */
export const BOUQUET: { plant: Flora; drawing: Drawing; seed: number }[] =
  [...GARDEN, ...TET].map((plant) => {
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

/** How far into the opening the titling comes up. */
export const TITLED = 46;

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

  const flip = BOUQUET.length * PER_PLATE + LAST;
  out.push({ kind: "flip", start: at, length: flip, each: PER_PLATE });
  at += flip;

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

/* ----------------------------------------------------------------- sound -- */

/**
 * One sound for every rewrite.
 *
 * A pass is something happening to a living word, so it gets a droplet
 * rather than a click: a short wet blip whose pitch climbs while it sounds,
 * which is what a bubble leaving water does and what an ear reads as
 * organic rather than mechanical. The pitch walks up a pentatone as the
 * derivation deepens, so a plant sounds like it is growing instead of
 * ticking, and each species starts from a root of its own so no two
 * sections sound the same.
 */
export type Cue = {
  frame: number;
  /** Where the droplet starts, in hertz. */
  hz: number;
  /** How far the pitch climbs while it sounds, as a multiple. */
  sweep: number;
  /** Seconds. */
  dur: number;
  gain: number;
};

/** Degrees of a pentatone. Anything denser starts to sound like a tune. */
const PENTA = [0, 2, 4, 7, 9];

/** A root for each species, so a cut is heard as well as seen. */
const ROOTS = [294, 349, 262, 330, 311];

export const CUES: Cue[] = (() => {
  const rand = mulberry32(9);
  const out: Cue[] = [];
  let voice = 0;

  for (const shot of SHOTS) {
    if (shot.kind === "title") {
      out.push({
        frame: shot.start + TITLED,
        hz: 168,
        sweep: 1.06,
        dur: 0.34,
        gain: 0.4,
      });
      continue;
    }

    if (shot.kind === "flora") {
      const root = ROOTS[shot.index % ROOTS.length];
      // The cut itself, low and soft, under the name coming up.
      out.push({
        frame: shot.start,
        hz: root * 0.5,
        sweep: 1.12,
        dur: 0.2,
        gain: 0.38,
      });

      shot.movement.passes.forEach((_, k) => {
        const step =
          PENTA[k % PENTA.length] + 12 * Math.floor(k / PENTA.length);
        out.push({
          frame:
            shot.start + INTRO + k * PER_PASS + Math.round(PER_PASS * STRUCK),
          hz: root * Math.pow(2, step / 12) * (1 + (rand() - 0.5) * 0.03),
          sweep: 1.45 + rand() * 0.55,
          dur: 0.072 + rand() * 0.05,
          gain: 0.5 + rand() * 0.2,
        });
      });
      continue;
    }

    // The flip: lighter and drier, a page being turned rather than a bud
    // opening.
    for (let i = 0; i < BOUQUET.length; i++) {
      const step = PENTA[voice++ % PENTA.length];
      out.push({
        frame: shot.start + i * shot.each,
        hz: 500 * Math.pow(2, step / 12) * (1 + (rand() - 0.5) * 0.04),
        sweep: 1.2 + rand() * 0.3,
        dur: 0.05 + rand() * 0.025,
        gain: 0.28 + rand() * 0.1,
      });
    }
  }

  return out.sort((a, b) => a.frame - b.frame);
})();

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
