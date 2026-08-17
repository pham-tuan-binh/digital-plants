import { derive, parseRules, type TurtleOptions } from "./lsystem";

/**
 * A flora.
 *
 * Every one of these is a real plant with a name people use, and each is built
 * from a different structural idea rather than a different set of numbers on
 * the same idea. A tree that forks and hands over. A stalk that spends
 * everything on one bloom. A culm that never branches at all. A vine with no
 * leader that sprawls wherever there is room. The point of the collection is
 * that the productions differ, not the palette.
 */

export type Flora = {
  id: string;
  name: string;
  latin: string;
  english: string;
  /** What the plant is, in the world. */
  note: string;
  /** What the production is doing, and why that shape follows from it. */
  structure: string;
  axiom: string;
  rules: string;
  steps: number;
  seed: number;
  turtle: Partial<TurtleOptions> & { angle: number };
  /** Null heart means the flower has no distinct eye. */
  flower?: { outer: string; heart: string | null };
  petals?: number;
  /** How big the disc at the centre is, as a share of the head. */
  heartScale?: number;
  /** One ring of petals, or two set inside each other. */
  rings?: number;
  stemColour?: string;
  /** Roughly how tall it stands next to the others in a bed. */
  scale: number;
  /**
   * The fewest drawing symbols a specimen may have and still be worth
   * showing. A stochastic rule can terminate on its first roll, and a plant
   * that stopped growing immediately is a stub, not a specimen.
   */
  minDraw?: number;
};

export const FLORA: Flora[] = [
  {
    id: "mai",
    name: "Hoa mai",
    latin: "Ochna integerrima",
    english: "yellow apricot",
    note: "The Tết tree of the south. It sheds its leaves in the weeks before the new year and then flowers on bare wood, so the whole crown turns yellow at once instead of a little at a time.",
    structure: "The trunk forks low and hands its growth to equals, and each limb can fork again rather than only extending: that is the one production A → F[++A]F[--A], and it is the difference between a crown and three poles. Between forks the limb throws short spurs, B, and the flowers sit on those, close in to the wood, which is why the colour reads as a mass rather than a fringe.",
    axiom: "FFFT",
    rules: [
      // Trunk into three scaffold limbs, and from there every limb divides
      // rather than running on. A limb that only extends gives a bare pole
      // with a tuft at the end; a limb that halves each time fills a crown.
      "T -> F[++A]F[--A]FA",
      "A -> 0.48 : F[++A]F[--A]",
      "A -> 0.20 : F[++B]F[--A]",
      "A -> 0.18 : F[--B]F[+A]",
      "A -> 0.14 : FB",
      "B -> [+K][-K]F[++K][--K]K",
    ].join("\n"),
    steps: 9,
    seed: 14,
    turtle: {
      angle: 28,
      taper: 0.81,
      jitter: 13,
      tropism: 0.6,
      flowerSize: 0.62,
    },
    flower: { outer: "#e0b23f", heart: "#a9762a" },
    petals: 5,
    scale: 1,
    minDraw: 90,
  },
  {
    id: "dao",
    name: "Hoa đào",
    latin: "Prunus persica",
    english: "peach blossom",
    note: "The Tết tree of the north, where the wood needs a real winter before it will set flower. The pink is deeper the colder the season was.",
    structure: "Same fork, but weighted so a limb more often keeps going than divides, which is what gives peach its long reaching branches. Its spur B → [+K][-K]FK puts a pair of blossoms at the joint before continuing, so flower sits on old wood all the way along a limb rather than only near the ends.",
    axiom: "FFFT",
    rules: [
      "T -> F[++A]F[--A]FA",
      // Peach keeps more of a leader than apricot does, so one arm of each
      // fork carries on with a flowering spur on it.
      "A -> 0.52 : F[++A]F[--A]",
      "A -> 0.20 : F[++B]F[--A]",
      "A -> 0.16 : F[--B]F[+A]",
      "A -> 0.12 : FB",
      "B -> [+K][-K]F[+K][-K]K",
    ].join("\n"),
    steps: 10,
    seed: 33,
    turtle: {
      angle: 22,
      taper: 0.8,
      jitter: 8,
      tropism: 1.4,
      flowerSize: 0.5,
    },
    flower: { outer: "#dd9aab", heart: "#b25f79" },
    petals: 5,
    scale: 1,
    minDraw: 90,
  },
  {
    id: "sen",
    name: "Hoa sen",
    latin: "Nelumbo nucifera",
    english: "lotus",
    note: "Out of mud, one stalk, one round leaf held clear of the water, one bloom above them both.",
    structure: "There is no branching production at all. A → FA simply extends, and the only other rule ends it in a flower. Everything the plant has goes into height and a single terminal bloom, which is exactly what a rhizome sending up one scape does. The pad is not on the flower stalk at all: the axiom sends up a second, shorter stalk of its own beside it, because in a lotus both come separately off the rhizome under the mud.",
    // The pad sits low and off to one side; the flower is given a head start
    // in the axiom so it always stands clear above it.
    axiom: "[++FFFFL]FFFFFFFFA",
    rules: ["A -> 0.88 : FA", "A -> 0.12 : FFK"].join("\n"),
    steps: 12,
    seed: 7,
    turtle: {
      angle: 21,
      tropism: 5,
      jitter: 3,
      leafSize: 3.4,
      flowerSize: 2.3,
    },
    flower: { outer: "#e2a9bd", heart: "#c9973f" },
    petals: 11,
    rings: 2,
    heartScale: 0.16,
    scale: 0.95,
    minDraw: 14,
  },
  {
    id: "cuc",
    name: "Hoa cúc",
    latin: "Chrysanthemum indicum",
    english: "chrysanthemum",
    note: "A low bush carrying so many heads that you see the flowers before the plant.",
    structure: "The leading production forks in two and terminates in neither branch, so growth divides again and again and stays short: a bush is a tree that never picked a leader. Both other productions end a shoot in a head, so nearly every tip flowers at once. The heads take nine touches of the brush and no distinct eye, because a chrysanthemum's disc is buried under its own ray florets.",
    axiom: "FFA",
    rules: [
      "A -> 0.48 : F[++A]F[--A]F",
      "A -> 0.28 : F[+L]FK",
      "A -> 0.24 : F[-L]FK",
    ].join("\n"),
    steps: 6,
    seed: 21,
    turtle: {
      angle: 24,
      taper: 0.84,
      jitter: 7,
      tropism: 2,
      leafSize: 1.1,
      flowerSize: 1.05,
    },
    flower: { outer: "#e3c04a", heart: null },
    petals: 9,
    scale: 0.78,
    minDraw: 26,
  },
  {
    id: "phuong",
    name: "Hoa phượng",
    latin: "Delonix regia",
    english: "flamboyant",
    note: "The flower of the end of the school year, and the reddest thing in a Vietnamese summer.",
    structure: "The axiom forks four ways at once, T → [+++A][-A][+A][---A], and every limb after that both forks and flowers. Because nothing pulls the limbs upward, the crown spreads wider than the tree is tall, which is the flat umbrella shape a flamboyant makes over a street.",
    axiom: "FFFT",
    rules: [
      "T -> [+++A][-A][+A][---A]",
      "A -> 0.5 : F[++A][--A]FK",
      "A -> 0.28 : F[++A]FK",
      "A -> 0.22 : F[--A]FK",
    ].join("\n"),
    steps: 6,
    seed: 40,
    turtle: {
      angle: 26,
      taper: 0.74,
      jitter: 9,
      tropism: 0.4,
      flowerSize: 0.72,
    },
    flower: { outer: "#c4453c", heart: "#8d2b2c" },
    petals: 5,
    scale: 1,
    minDraw: 30,
  },
  {
    id: "giay",
    name: "Hoa giấy",
    latin: "Bougainvillea glabra",
    english: "paper flower",
    note: "A vine that will cover a wall, a gate and then the neighbour's gate. What look like petals are bracts, which is why the colour is so flat.",
    structure: "There is no leader and no tropism: the productions put a branch on one side and a flower on the other, alternating at random, and nothing pulls the result upright. A plant with no sense of up sprawls, and a heavy hand-wobble at every joint keeps it from ever looking planned.",
    axiom: "A",
    rules: [
      "A -> 0.42 : F[+A]F[-K]A",
      "A -> 0.32 : F[-A]F[+K]A",
      "A -> 0.26 : F[+L]FK",
    ].join("\n"),
    steps: 8,
    seed: 55,
    turtle: {
      angle: 33,
      taper: 0.9,
      jitter: 15,
      tropism: 0.2,
      leafSize: 1,
      flowerSize: 0.9,
    },
    flower: { outer: "#c0417e", heart: "#e8dcc8" },
    petals: 3,
    scale: 0.86,
    minDraw: 26,
  },
  {
    id: "su",
    name: "Hoa sứ",
    latin: "Plumeria rubra",
    english: "frangipani",
    note: "Frangipani. Thick blunt branches, bare for most of their length, then a heavy cluster of cream flowers at the end of each one.",
    structure: "The tree is forced through two forks before it is allowed to finish, so it always has a candelabrum of limbs. A limb carries nothing along its length and terminates in FF[+K][-K]K, three flowers together at the tip, which is why the tree reads as bare branches with a bunch stuck on the end of each.",
    axiom: "FFT",
    rules: [
      // Every fork is lopsided and no two joints bend alike, which is what
      // keeps a candelabrum of thick branches from looking machined.
      "T -> F[++A][-A]",
      "A -> 0.44 : F[++A][--A]",
      "A -> 0.30 : F[+A][---A]",
      "A -> 0.26 : FF[+K][-K]K",
    ].join("\n"),
    steps: 7,
    seed: 62,
    turtle: {
      angle: 27,
      taper: 0.86,
      jitter: 16,
      tropism: 0.8,
      flowerSize: 1.1,
    },
    flower: { outer: "#e8dcbe", heart: "#d8a740" },
    petals: 5,
    scale: 0.88,
    minDraw: 18,
  },
  {
    id: "huongduong",
    name: "Hoa hướng dương",
    latin: "Helianthus annuus",
    english: "sunflower",
    note: "One stem, leaves the whole way up it, and a head so heavy the stalk bends under it by the end of the season.",
    structure: "There is no branching production at all, only extension, so every unit of growth goes into height and one terminal head. The head takes eighteen touches of the brush against most flowers' five, because a sunflower is not one flower but a disc of several hundred florets packed on the golden angle.",
    axiom: "[++L]F[--L]FFA",
    rules: [
      "A -> 0.86 : F[++L]F[--L]A",
      "A -> 0.14 : FFK",
    ].join("\n"),
    steps: 12,
    seed: 11,
    turtle: { angle: 26, tropism: 6, jitter: 4, leafSize: 1.3, flowerSize: 4.2 },
    flower: { outer: "#e0b544", heart: "#6b4a21" },
    petals: 18,
    heartScale: 0.5,
    scale: 0.95,
    minDraw: 12,
  },
  {
    id: "lan",
    name: "Hoa lan",
    latin: "Dendrobium nobile",
    english: "orchid",
    note: "An arching spray with the flowers hung along the underside of the curve, all facing the same way.",
    structure: "The stem is a grass production, F−A, so it arches; what makes it an orchid is that the flower bracket is only ever on one side of it. A rule that never chooses the other side gives a spray that faces you rather than a stem with flowers scattered round it.",
    axiom: "A",
    rules: ["A -> 0.82 : F-[+K]A", "A -> 0.18 : F-K"].join("\n"),
    steps: 14,
    seed: 23,
    turtle: { angle: 7.5, jitter: 3, flowerSize: 1.05 },
    flower: { outer: "#c9a6c6", heart: "#8a5f8c" },
    petals: 5,
    scale: 0.7,
    minDraw: 14,
  },
  {
    id: "dambut",
    name: "Hoa dâm bụt",
    latin: "Hibiscus rosa-sinensis",
    english: "hibiscus",
    note: "The hedge flower of every schoolyard and half the front gates in the country. Big single blooms, one to a shoot, and never many open at once.",
    structure: "A shrub production that forks in two, with the two flowering rules weighted low so most shoots are still growing at any moment. That is why a hibiscus in a hedge carries a few enormous flowers rather than a mass of small ones: the plant is spending on size, not on number.",
    axiom: "FFA",
    rules: [
      "A -> 0.54 : F[++A][--A]F",
      "A -> 0.24 : F[+L]FK",
      "A -> 0.22 : F[-L]FK",
    ].join("\n"),
    steps: 6,
    seed: 31,
    turtle: {
      angle: 28,
      taper: 0.86,
      jitter: 9,
      tropism: 1.6,
      leafSize: 1.6,
      flowerSize: 1.7,
    },
    flower: { outer: "#cc4a48", heart: "#8e2f38" },
    petals: 5,
    scale: 0.72,
    minDraw: 20,
  },
  {
    id: "nhai",
    name: "Hoa nhài",
    latin: "Jasminum sambac",
    english: "jasmine",
    note: "A wiry little shrub carrying more flowers than it seems able to hold, and the reason a pot of tea smells the way it does.",
    structure: "The opposite bargain to the hibiscus above it: the same fork, but both flowering rules fire often and the flower itself is a third the size. Small and many, rather than large and few, out of one change of weighting.",
    axiom: "FA",
    rules: [
      "A -> 0.44 : F[+A]F[-A]A",
      "A -> 0.30 : F[+L]K",
      "A -> 0.26 : F[-L]K",
    ].join("\n"),
    steps: 6,
    seed: 46,
    turtle: {
      angle: 31,
      taper: 0.88,
      jitter: 12,
      tropism: 1.2,
      leafSize: 1,
      flowerSize: 0.62,
    },
    flower: { outer: "#efe7d6", heart: "#cbb98c" },
    petals: 6,
    scale: 0.6,
    minDraw: 24,
  },
  {
    id: "gao",
    name: "Hoa gạo",
    latin: "Bombax ceiba",
    english: "red silk-cotton",
    note: "It flowers in March on bare grey branches, and the blooms are heavy enough to hear when they land.",
    structure: "A tree grammar that forks and then stops, with no spur productions at all: every flower sits directly on the end of a limb, which is why the tree reads as a bare frame with lamps hung on it rather than a crown of blossom.",
    axiom: "FFFT",
    rules: [
      "T -> F[++A]F[--A]FA",
      "A -> 0.52 : F[++A]F[--A]",
      "A -> 0.48 : FFK",
    ].join("\n"),
    steps: 7,
    seed: 58,
    turtle: {
      angle: 27,
      taper: 0.8,
      jitter: 10,
      tropism: 0.9,
      flowerSize: 1.45,
    },
    flower: { outer: "#c0392f", heart: "#7d2320" },
    petals: 5,
    scale: 1,
    minDraw: 22,
  },
  {
    id: "lau",
    name: "Cỏ lau",
    latin: "Saccharum spontaneum",
    english: "reed",
    note: "Reed. A blade until it stops, and then a plume that catches the light.",
    structure: "The blade is the same production as any grass, A → F−A: draw a little, turn a little. The angle is small enough that thirty of them read as a curve rather than a corner. The head is a short chain of four more productions, each shedding a pair of catkins, so the fluff at the top is nothing but the last four passes of the same derivation.",
    axiom: "A",
    rules: [
      "A -> 0.86 : F-A",
      "A -> 0.14 : FP",
      // The plume: four short nodes, each dropping a pair of catkins, which
      // is what turns a bare blade into something fluffy at the end.
      "P -> F[++K][--K]Q",
      "Q -> F[++K][--K]R",
      "R -> F[+K][-K]S",
      "S -> F[+K][-K]K",
    ].join("\n"),
    steps: 16,
    seed: 88,
    turtle: {
      angle: 2.9,
      jitter: 2,
      flowerSize: 0.8,
    },
    flower: { outer: "#c7bda9", heart: null },
    petals: 7,
    scale: 1,
    minDraw: 14,
  },
  {
    id: "dai",
    name: "Cỏ dại",
    latin: "Digitaria ciliaris",
    english: "wild grass",
    note: "The grass in the gaps of everything else.",
    structure: "A tuft rather than a plant: the axiom places five blades at once and each runs the reed's production, stopped early. Nothing here needs a rewriting rule to make a clump, only an axiom with five brackets in it.",
    axiom: "[+++A][+A][A][-A][---A]",
    rules: ["A -> 0.8 : F-A", "A -> 0.2 : F"].join("\n"),
    steps: 7,
    seed: 44,
    turtle: {
      angle: 5.5,
      jitter: 4,
    },
    scale: 0.3,
    minDraw: 10,
  },
  {
    id: "lua",
    name: "Lúa",
    latin: "Oryza sativa",
    english: "rice",
    note: "Rice. A field ready to cut leans all one way, because every stem is carrying the same weight.",
    structure: "The stem is a grass production with a larger turn, so it arches instead of standing. The panicle opens in a single pass, F[+K][-K][++K][--K]K, which matters: if it needed a second pass a late roll would leave the grain unwritten and the plant would come up bare.",
    axiom: "A",
    rules: [
      "A -> 0.8 : F-A",
      // The head is a broom: five arms off one node, each bending further
      // over as it goes and shedding grain the whole way down.
      "A -> 0.2 : F[++P][+P][P][-P][--P]",
      "P -> F-[+K][-K]Q",
      "Q -> F--[+K][-K]R",
      "R -> F--[+K]K",
    ].join("\n"),
    steps: 18,
    seed: 17,
    turtle: {
      angle: 4.4,
      jitter: 3,
      flowerSize: 0.5,
    },
    flower: { outer: "#d9bd6a", heart: null },
    petals: 4,
    scale: 0.82,
    minDraw: 12,
  },
];

/**
 * Grow one plant, and insist that it actually flowers.
 *
 * The production that makes a flower is stochastic, so a given seed can run
 * out of passes having never fired it and come up as a bare stalk. That is
 * honest in a bed of twenty, where a plant that has not bloomed yet is a real
 * thing to see, but it is no good for a figure whose whole job is to show
 * what the species looks like. Walk to the next seed until the word contains
 * a bloom.
 */
export function growFlora(
  plant: Flora,
  seed: number,
  steps = plant.steps,
): { word: string; seed: number } {
  const { rules } = parseRules(plant.rules);
  const wantsFlower = plant.rules.includes("K");
  const least = plant.minDraw ?? Math.max(6, steps);
  const drawn = (w: string) =>
    [...w].filter((c) => "FGABS".includes(c)).length;

  let word = "";
  let used = seed;
  let best = "";
  let bestSeed = seed;

  for (let tries = 0; tries < 40; tries++) {
    const gens = derive(plant.axiom, rules, steps, used);
    word = gens[gens.length - 1] ?? "";
    if (drawn(word) > drawn(best)) {
      best = word;
      bestSeed = used;
    }
    const bloomed = !wantsFlower || word.includes("K");
    if (bloomed && drawn(word) >= least) return { word, seed: used };
    used += 1;
  }
  // Nothing cleared the bar, so show the largest specimen we found.
  return { word: best, seed: bestSeed };
}

export const TET = FLORA.filter((f) => f.id === "mai" || f.id === "dao");

/** The flora, less the two trees that get a section of their own. */
export const GARDEN = FLORA.filter((f) => !TET.includes(f));
