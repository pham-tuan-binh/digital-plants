import type { TurtleOptions } from "./lsystem";

/**
 * Four trees of my own.
 *
 * None of these are from the literature. Each one starts from a question about
 * how a tree spends its growth — does the leader keep going or hand over? do
 * side branches get a full share of length or a fraction? — and the rule set
 * is the answer written down. The parameters were tuned by drawing them.
 */

export type Tree = {
  id: string;
  name: string;
  /** What decision this tree's rules encode. */
  note: string;
  axiom: string;
  rules: string;
  steps: number;
  seed: number;
  turtle: Partial<TurtleOptions> & { angle: number };
};

export const TREES: Tree[] = [
  {
    id: "field",
    name: "Field standard",
    note: "The leader gives up early and hands its growth to two equals, so the crown spreads as wide as it is tall. A tree with no neighbours and no reason to hurry upward.",
    axiom: "FFA",
    rules: [
      "A -> 0.40 : F[+FA][-FA]",
      "A -> 0.32 : F[+FA]FA",
      "A -> 0.28 : F[-FA]FA",
    ].join("\n"),
    steps: 9,
    seed: 24,
    turtle: { angle: 27, taper: 0.74, jitter: 7, tropism: 1.2 },
  },
  {
    id: "column",
    name: "Churchyard column",
    note: "The opposite bargain. The leader never surrenders, side branches are cut to a fraction of its length, and a strong pull upward keeps everything pressed to the vertical.",
    axiom: "FFFA",
    rules: ["A -> F[+B]F[-B]FA", "B -> F[+F]F[-F]F"].join("\n"),
    steps: 7,
    seed: 5,
    turtle: { angle: 15, taper: 0.52, jitter: 4, tropism: 7 },
  },
  {
    id: "weather",
    name: "Weather side",
    note: "The same growth as the field standard, but the light it leans into is off to one side. Every segment bends a little east, and eight years of that is a shape you can read the wind from.",
    axiom: "FFA",
    rules: [
      "A -> 0.45 : F[+FA][-FA]",
      "A -> 0.30 : F[-FA]FA",
      "A -> 0.25 : F[+FA]F",
    ].join("\n"),
    steps: 9,
    seed: 61,
    turtle: {
      angle: 25,
      taper: 0.72,
      jitter: 11,
      tropism: 4.5,
      tropismAngle: 52,
    },
  },
  {
    id: "orchard",
    name: "Old orchard",
    note: "Pruned for fruit, not for height: wide crotch angles, few forks, and a heavy wobble in every joint. Left long enough, a tree cut back this hard grows into its own knuckles.",
    axiom: "FA",
    rules: [
      "A -> 0.50 : F[++FA][--FA]F",
      "A -> 0.28 : F[++FA]FF",
      "A -> 0.22 : F[--FA]FF",
    ].join("\n"),
    steps: 8,
    seed: 12,
    turtle: { angle: 19, taper: 0.78, jitter: 14, tropism: 0.8 },
  },
];
