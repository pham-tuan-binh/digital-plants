import type { TurtleOptions } from "./lsystem";

export type Preset = {
  id: string;
  name: string;
  /** Where it comes from, in the reader's language, not a citation. */
  note: string;
  axiom: string;
  rules: string;
  steps: number;
  turtle: Partial<TurtleOptions> & { angle: number };
  /** Paint the stem in this colour instead of drawing it in graphite. */
  stemColour?: string;
};

/**
 * The classics. Most of these are the figures from Prusinkiewicz and
 * Lindenmayer's *The Algorithmic Beauty of Plants* — the book that worked all
 * of this out in 1990.
 */
export const PLANT_PRESETS: Preset[] = [
  {
    id: "bush",
    name: "Three-way bush",
    note: "Every stem splits left, right, and straight on.",
    axiom: "F",
    rules: "F -> F[+F]F[-F]F",
    steps: 4,
    turtle: { angle: 25.7 },
  },
  {
    id: "sparse",
    name: "Open shrub",
    note: "The same idea, but one branch is left to run ahead.",
    axiom: "F",
    rules: "F -> F[+F]F[-F][F]",
    steps: 4,
    turtle: { angle: 20 },
  },
  {
    id: "thicket",
    name: "Thicket",
    note: "A wider fan, drawn with a doubled trunk.",
    axiom: "F",
    rules: "F -> FF-[-F+F+F]+[+F-F-F]",
    steps: 4,
    turtle: { angle: 22.5 },
  },
  {
    id: "sapling",
    name: "Sapling",
    note: "X is a bud: it shapes the plant but never draws a line.",
    axiom: "X",
    rules: "X -> F[+X]F[-X]+X\nF -> FF",
    steps: 6,
    turtle: { angle: 20 },
  },
  {
    id: "willow",
    name: "Weeping willow",
    note: "Two buds on every stem, so the crown fills in fast.",
    axiom: "X",
    rules: "X -> F[+X][-X]FX\nF -> FF",
    steps: 6,
    turtle: { angle: 25.7 },
  },
  {
    id: "fern",
    name: "Fern frond",
    note: "Branches nested inside branches: a leaf shaped like the plant.",
    axiom: "X",
    rules: "X -> F-[[X]+X]+F[+FX]-X\nF -> FF",
    steps: 5,
    turtle: { angle: 22.5 },
  },
];

export const CURVE_PRESETS: Preset[] = [
  {
    id: "koch",
    name: "Koch island",
    note: "A coastline that never stops crinkling.",
    axiom: "F-F-F-F",
    rules: "F -> F-F+F+FF-F-F+F",
    steps: 3,
    turtle: { angle: 90, startAngle: 0 },
  },
  {
    id: "sierpinski",
    name: "Sierpiński gasket",
    note: "Two rules that trade places, over and over.",
    axiom: "F",
    rules: "F -> G-F-G\nG -> F+G+F",
    steps: 6,
    turtle: { angle: 60, startAngle: 0 },
  },
  {
    id: "dragon",
    name: "Dragon curve",
    note: "A single fold, repeated until it looks like a river.",
    axiom: "F",
    rules: "F -> F+G\nG -> F-G",
    steps: 11,
    turtle: { angle: 90, startAngle: 0 },
  },
];

/** The one the derivation ladder walks through, step by step. */
export const LADDER: Preset = PLANT_PRESETS[0];

/**
 * Species for the bed.
 *
 * The head is grown by the rules, not stuck on the end of a stalk. These are
 * the classical inflorescence types: an umbel throws several pedicels from one
 * node, a raceme carries its flowers up an axis, a cyme forks and terminates
 * in a flower each time, and a solitary plant spends everything on one bloom
 * over a rosette of leaves. Leaves alternate rather than sitting in opposite
 * pairs, which is both commoner in nature and far less mechanical to look at.
 */
export const GARDEN_PRESETS: Preset[] = [
  {
    id: "umbel",
    name: "Umbel",
    note: "One node throws five pedicels, each ending in a floret. Cow parsley and wild carrot are built this way.",
    axiom: "A",
    rules: [
      "A -> 0.74 : F[++++L]B",
      "A -> 0.26 : FU",
      "B -> 0.74 : F[----L]A",
      "B -> 0.26 : FU",
      "U -> [++++FFK][++FFFK][FFFFK][--FFFK][----FFK]",
    ].join("\n"),
    steps: 13,
    turtle: { angle: 14, leafSize: 1.5, flowerSize: 0.85, tropism: 2.5, jitter: 3 },
  },
  {
    id: "raceme",
    name: "Raceme",
    note: "Flowers open up the axis, oldest at the bottom, so one plant shows every age at once.",
    axiom: "[+++L][---L]FA",
    rules: [
      "A -> 0.82 : F[+++FK]B",
      "A -> 0.18 : FB",
      "B -> 0.82 : F[---FK]A",
      "B -> 0.18 : FA",
    ].join("\n"),
    steps: 13,
    turtle: { angle: 14, leafSize: 1.7, flowerSize: 0.7, tropism: 3, jitter: 3 },
  },
  {
    id: "cyme",
    name: "Cyme",
    note: "The tip becomes a flower and a side shoot takes over, again and again.",
    axiom: "A",
    rules: [
      "A -> 0.5 : F[+++A]F[--L]FK",
      "A -> 0.5 : F[---A]F[++L]FK",
    ].join("\n"),
    steps: 6,
    turtle: { angle: 15, leafSize: 1.5, flowerSize: 0.95, tropism: 2, jitter: 4 },
  },
  {
    id: "solitary",
    name: "Solitary",
    note: "A rosette of leaves at the ground, a bare scape, and everything spent on one bloom.",
    axiom: "[+L][---L][++++L][------L][+++++++L]A",
    rules: ["A -> 0.76 : FA", "A -> 0.24 : FFK"].join("\n"),
    steps: 12,
    turtle: { angle: 13, leafSize: 2.1, flowerSize: 1.7, tropism: 3, jitter: 3 },
  },
  {
    id: "grass",
    name: "Long grass",
    note: "One blade, leaning. Sow a dozen with different seeds.",
    axiom: "S",
    rules: "S -> 0.78 : F-S\nS -> 0.22 : FS",
    steps: 13,
    turtle: { angle: 2.6, jitter: 1.9 },
    // A blade of grass is one stroke of a loaded brush, not a pencil line.
    stemColour: "#77894f",
  },
];
