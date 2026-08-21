/**
 * The score: what is on screen, frame by frame.
 *
 * The film is cut in frames rather than seconds because it is photographed a
 * frame at a time, not played. Nothing here reads a clock — given a frame
 * number, this works out which shot it falls in and how far through, and the
 * page draws exactly that. Two runs of the capture are then identical, and a
 * slow machine makes a slow capture rather than a stuttering film.
 */

import { GARDEN, TET, growFlora, type Flora } from "@/lib/flora";
import {
  derive,
  interpret,
  mulberry32,
  parseRules,
  type Drawing,
} from "@/lib/lsystem";
import { ladder, type Pass } from "./derivation";

export const FPS = 30;

/** Every species, in the book's own order: the garden, then the Tết trees. */
const CAST: Flora[] = [...GARDEN, ...TET];

const TITLE = 180; // 6s — the landing page of the book, and its epigraph
const NAME = 26; //    the species, alone on the page
const RULES = 34; //   its productions, a line at a time
const AXIOM = 30; //   the word it starts from, and the plant that word draws
const OPEN = NAME + RULES + AXIOM;
const HOLD = 26; //    the finished plant, before the dissolve
/** The last plant is not dissolved away; the film simply stops on it. */
const LAST = 34;
/** How long a shot takes to come up out of the paper, and go back into it. */
export const DISSOLVE = 11;

/**
 * How long one rewrite is held.
 *
 * A grass that takes eighteen passes to put out a head should not take three
 * times as long on screen as a tree that is done in six. The longer the
 * derivation, the quicker each pass of it goes by, which keeps every species
 * to roughly the same length of film without any of them feeling hurried.
 */
function perPass(passes: number): number {
  if (passes > 12) return 12;
  if (passes > 8) return 15;
  return 18;
}

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
  /** The system, set out a line at a time so it can be read onto the page. */
  system: { mark: string; text: string }[];
};

export type Shot =
  | { kind: "title"; start: number; length: number }
  | {
      kind: "flora";
      start: number;
      length: number;
      index: number;
      per: number;
      /** False on the last shot, which is held rather than dissolved. */
      out: boolean;
      movement: Movement;
    };

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

  const system = [
    { mark: "ω", text: plant.axiom },
    ...plant.rules
      .split("\n")
      .map((line, i) => ({ mark: i === 0 ? "P" : "", text: line.replace(/->/g, "→") })),
    { mark: "δ", text: `${plant.turtle.angle}°` },
  ];

  return { plant, seed: grown.seed, rungs, passes, system };
}

export const MOVEMENTS: Movement[] = CAST.map(movement);

export const SHOTS: Shot[] = (() => {
  const out: Shot[] = [];
  let at = 0;

  out.push({ kind: "title", start: at, length: TITLE });
  at += TITLE;

  MOVEMENTS.forEach((m, index) => {
    const last = index === MOVEMENTS.length - 1;
    const per = perPass(m.passes.length);
    const length = OPEN + m.passes.length * per + (last ? LAST : HOLD);
    out.push({
      kind: "flora",
      start: at,
      length,
      index,
      per,
      out: !last,
      movement: m,
    });
    at += length;
  });

  return out;
})();

export const FRAMES =
  SHOTS[SHOTS.length - 1].start + SHOTS[SHOTS.length - 1].length;

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
  /** How far up the naming is, 0 to 1. */
  named: number;
  /** Frames since the productions began coming onto the page. */
  ruled: number;
  /** How far up the word is, 0 to 1. */
  worded: number;
  /** How strongly this pass's marking is washed in, 0 to 1. */
  wash: number;
  /** The whole shot's own fade, in and out of the paper. */
  fade: number;
};

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export function beatAt(
  shot: Extract<Shot, { kind: "flora" }>,
  local: number,
): Beat {
  const m = shot.movement;
  const per = shot.per;
  const passes = m.passes.length;

  const fade = Math.min(
    ease(clamp01(local / DISSOLVE)),
    shot.out ? ease(clamp01((shot.length - local) / DISSOLVE)) : 1,
  );
  const named = ease(clamp01((local - 4) / 18));
  const ruled = local - NAME;
  const worded = ease(clamp01((local - NAME - RULES) / 14));

  const base = {
    named,
    ruled,
    worded,
    fade,
  };

  // The axiom, and the plant it draws, coming up together.
  if (local < OPEN) {
    const start = m.rungs[0];
    const sprout = ease(clamp01((local - NAME - RULES - 6) / (AXIOM - 10)));
    return {
      ...base,
      n: 0,
      rung: start,
      pass: null,
      striking: false,
      reveal: Math.round(sprout * start.segments),
      wash: 0,
    };
  }

  const into = local - OPEN;
  const k = Math.floor(into / per);

  if (k >= passes) {
    const last = m.rungs[m.rungs.length - 1];
    return {
      ...base,
      n: m.rungs.length - 1,
      rung: last,
      pass: null,
      striking: false,
      reveal: last.segments,
      wash: 0,
    };
  }

  const u = (into % per) / per;

  if (u < STRUCK) {
    // The letters this pass will strike out, washing in.
    const p = u / STRUCK;
    return {
      ...base,
      n: k,
      rung: m.rungs[k],
      pass: m.passes[k],
      striking: true,
      reveal: m.rungs[k].segments,
      wash: ease(clamp01(p / 0.5)),
    };
  }

  // The new word is up; the plant grows into the strokes it added, and the
  // wash on what was just written softens away before the next pass marks up.
  const q = (u - STRUCK) / (1 - STRUCK);
  const grown = ease(clamp01(q / 0.82));
  const before = Math.min(m.rungs[k].segments, m.rungs[k + 1].segments);
  const after = m.rungs[k + 1].segments;
  return {
    ...base,
    n: k + 1,
    rung: m.rungs[k + 1],
    pass: m.passes[k],
    striking: false,
    reveal: Math.round(before + (after - before) * grown),
    wash: 1 - ease(clamp01((q - 0.5) / 0.5)) * 0.8,
  };
}

/** How far up one line of the system is, given how long the rules have run. */
export function lineAt(ruled: number, i: number): number {
  return ease(clamp01((ruled - 2 - i * 3.5) / 12));
}

/* ----------------------------------------------------------------- sound -- */

/**
 * One sound for every rewrite.
 *
 * A pass is something happening to a living word, so it gets a droplet
 * rather than a click: a short wet blip whose pitch climbs while it sounds,
 * which is what a bubble leaving water does and what an ear reads as organic
 * rather than mechanical. The pitch walks up a pentatone as the derivation
 * deepens, so a plant sounds like it is growing instead of ticking, and each
 * species starts from a root of its own so no two run the same way.
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
const ROOTS = [294, 349, 262, 330, 311, 277, 392];

/** How far into the opening the titling comes up. */
export const TITLED = 74;

export const CUES: Cue[] = (() => {
  const rand = mulberry32(9);
  const out: Cue[] = [];

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

    const root = ROOTS[shot.index % ROOTS.length];

    // The cut itself, low and soft, under the name coming up.
    out.push({
      frame: shot.start + 4,
      hz: root * 0.5,
      sweep: 1.12,
      dur: 0.22,
      gain: 0.36,
    });

    // The axiom arriving: the seed of the thing, a fifth under the root.
    out.push({
      frame: shot.start + NAME + RULES,
      hz: root * 0.75,
      sweep: 1.2,
      dur: 0.16,
      gain: 0.3,
    });

    shot.movement.passes.forEach((_, k) => {
      const step = PENTA[k % PENTA.length] + 12 * Math.floor(k / PENTA.length);
      out.push({
        frame: shot.start + OPEN + k * shot.per + Math.round(shot.per * STRUCK),
        hz: root * Math.pow(2, step / 12) * (1 + (rand() - 0.5) * 0.03),
        sweep: 1.45 + rand() * 0.55,
        dur: 0.072 + rand() * 0.05,
        gain: 0.5 + rand() * 0.2,
      });
    });
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
