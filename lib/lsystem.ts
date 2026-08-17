// The L-system engine: rewriting, then turtle interpretation.
//
// Two independent halves, on purpose. `derive` knows nothing about geometry —
// it only rewrites text. `interpret` knows nothing about rewriting — it only
// walks a string and leaves a trail. That split is the idea the whole site is
// trying to teach, so the code keeps it honest.

export type Rule = {
  symbol: string;
  /** One or more successors. More than one = stochastic; picked by weight. */
  successors: { text: string; weight: number }[];
};

export const MAX_STRING = 400_000;

/** A single rewrite pass: every symbol is replaced at once. */
export function rewrite(
  input: string,
  rules: Rule[],
  rand: () => number,
): string {
  const table = new Map<string, Rule>();
  for (const r of rules) if (r.symbol) table.set(r.symbol[0], r);

  let out = "";
  for (const ch of input) {
    const rule = table.get(ch);
    if (!rule || rule.successors.length === 0) {
      out += ch; // no production: a symbol stands for itself
      continue;
    }
    out += pick(rule.successors, rand);
    if (out.length > MAX_STRING) return out.slice(0, MAX_STRING);
  }
  return out;
}

function pick(
  successors: { text: string; weight: number }[],
  rand: () => number,
): string {
  if (successors.length === 1) return successors[0].text;
  const total = successors.reduce((s, x) => s + Math.max(0, x.weight), 0);
  if (total <= 0) return successors[0].text;
  let t = rand() * total;
  for (const s of successors) {
    t -= Math.max(0, s.weight);
    if (t <= 0) return s.text;
  }
  return successors[successors.length - 1].text;
}

/** Every generation from n = 0 up to `steps`, so the reader can see the ladder. */
export function derive(
  axiom: string,
  rules: Rule[],
  steps: number,
  seed = 1,
): string[] {
  const rand = mulberry32(seed);
  const generations = [axiom];
  for (let i = 0; i < steps; i++) {
    const next = rewrite(generations[generations.length - 1], rules, rand);
    generations.push(next);
    if (next.length >= MAX_STRING) break;
  }
  return generations;
}

// ---------------------------------------------------------------- turtle ---

export type Segment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Index into the source string of the symbol that drew this line. */
  srcIndex: number;
  /** Bracket nesting depth — drives taper and colour. */
  depth: number;
  /** How far along its own branch, 0 at the base and 1 at the tip. */
  along: number;
};

export type Ornament = {
  kind: "leaf" | "flower";
  x: number;
  y: number;
  /** Heading in radians, so the organ can be laid down facing the right way. */
  angle: number;
  size: number;
  srcIndex: number;
  depth: number;
};

export type Drawing = {
  segments: Segment[];
  ornaments: Ornament[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  /** True when the turtle hit the budget and stopped early. */
  truncated: boolean;
};

export type TurtleOptions = {
  angle: number;
  step: number;
  startAngle?: number;
  /** Multiplies step length each time the turtle enters a branch. */
  taper?: number;
  /** Degrees of drift added per segment, pulling growth toward `tropismAngle`. */
  tropism?: number;
  /** The direction growth is pulled toward. 90 is straight up. */
  tropismAngle?: number;
  leafSize?: number;
  flowerSize?: number;
  budget?: number;
  seed?: number;
  /** Random jitter on every turn, in degrees. Makes a stand of grass look grown. */
  jitter?: number;
};

type State = {
  x: number;
  y: number;
  heading: number;
  step: number;
  depth: number;
  along: number;
};

const DRAW = new Set(["F", "G", "A", "B", "S"]);
const MOVE = new Set(["f", "g"]);

/**
 * Walk the string and record what the turtle drew.
 *
 * Coordinates are mathematical: +y is up. The renderer flips them.
 */
export function interpret(
  source: string,
  opts: TurtleOptions,
): Drawing {
  const {
    angle,
    step,
    startAngle = 90,
    taper = 1,
    tropism = 0,
    tropismAngle = 90,
    leafSize = 1,
    flowerSize = 1,
    budget = 60_000,
    seed = 7,
    jitter = 0,
  } = opts;

  const rand = mulberry32(seed);
  const turn = (angle * Math.PI) / 180;
  const drift = (tropism * Math.PI) / 180;
  const jit = (jitter * Math.PI) / 180;

  const segments: Segment[] = [];
  const ornaments: Ornament[] = [];
  const stack: State[] = [];

  let s: State = {
    x: 0,
    y: 0,
    heading: (startAngle * Math.PI) / 180,
    step,
    depth: 0,
    along: 0,
  };

  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  let truncated = false;

  const mark = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  const wobble = () => (jit === 0 ? 0 : (rand() - 0.5) * 2 * jit);

  for (let i = 0; i < source.length; i++) {
    if (segments.length >= budget) {
      truncated = true;
      break;
    }
    const ch = source[i];

    if (DRAW.has(ch) || MOVE.has(ch)) {
      // Tropism bends the heading a little toward the light — or, for a tree
      // on an exposed slope, toward whatever direction the wind allows.
      if (drift !== 0) {
        const up = (tropismAngle * Math.PI) / 180;
        let delta = up - s.heading;
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        s.heading += Math.sign(delta) * Math.min(Math.abs(delta), drift);
      }
      const nx = s.x + Math.cos(s.heading) * s.step;
      const ny = s.y + Math.sin(s.heading) * s.step;
      if (DRAW.has(ch)) {
        s.along += 1;
        segments.push({
          x1: s.x,
          y1: s.y,
          x2: nx,
          y2: ny,
          srcIndex: i,
          depth: s.depth,
          along: s.along,
        });
      }
      s.x = nx;
      s.y = ny;
      mark(nx, ny);
      continue;
    }

    switch (ch) {
      case "+":
        s.heading += turn + wobble();
        break;
      case "-":
        s.heading -= turn + wobble();
        break;
      case "|":
        s.heading += Math.PI;
        break;
      case "[":
        stack.push({ ...s });
        s.depth += 1;
        s.step *= taper;
        break;
      case "]": {
        const prev = stack.pop();
        if (prev) s = prev;
        break;
      }
      case "!":
        s.step *= 0.7;
        break;
      case "L":
        ornaments.push({
          kind: "leaf",
          x: s.x,
          y: s.y,
          angle: s.heading,
          size: leafSize * s.step,
          srcIndex: i,
          depth: s.depth,
        });
        mark(s.x + leafSize * s.step * 1.5, s.y + leafSize * s.step * 1.5);
        mark(s.x - leafSize * s.step * 1.5, s.y - leafSize * s.step * 1.5);
        break;
      case "K":
        ornaments.push({
          kind: "flower",
          x: s.x,
          y: s.y,
          angle: s.heading,
          size: flowerSize * s.step,
          srcIndex: i,
          depth: s.depth,
        });
        mark(s.x + flowerSize * s.step * 2, s.y + flowerSize * s.step * 2);
        mark(s.x - flowerSize * s.step * 2, s.y - flowerSize * s.step * 2);
        break;
      default:
        break; // placeholders like X carry structure, draw nothing
    }
  }

  // Normalise `along` to 0..1 per branch so renderers can taper a stem.
  const maxAlong = segments.reduce((m, seg) => Math.max(m, seg.along), 1);
  for (const seg of segments) seg.along = seg.along / maxAlong;

  return {
    segments,
    ornaments,
    bounds: { minX, minY, maxX, maxY },
    truncated,
  };
}

/** Small deterministic PRNG, so a given seed always grows the same plant. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------- rule text ---

/** Parse the textarea form `F -> F[+F]F` into rules, one per line. */
export function parseRules(text: string): { rules: Rule[]; errors: string[] } {
  const rules: Rule[] = [];
  const errors: string[] = [];
  const bySymbol = new Map<string, Rule>();

  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;

    const m = line.match(/^(\S)\s*(?:->|→|=)\s*(.*)$/);
    if (!m) {
      errors.push(`Line ${i + 1}: write a rule as  F -> F[+F]F`);
      return;
    }
    const [, symbol, rest] = m;

    // Optional leading weight for stochastic rules:  F -> 0.4 : F[+F]F
    const weighted = rest.match(/^([\d.]+)\s*:\s*(.*)$/);
    const weight = weighted ? parseFloat(weighted[1]) : 1;
    const successor = weighted ? weighted[2].trim() : rest.trim();

    const existing = bySymbol.get(symbol);
    if (existing) {
      existing.successors.push({ text: successor, weight });
    } else {
      const rule: Rule = {
        symbol,
        successors: [{ text: successor, weight }],
      };
      bySymbol.set(symbol, rule);
      rules.push(rule);
    }
  });

  return { rules, errors };
}

export function rulesToText(rules: Rule[]): string {
  return rules
    .flatMap((r) =>
      r.successors.map((s) =>
        r.successors.length > 1
          ? `${r.symbol} -> ${s.weight} : ${s.text}`
          : `${r.symbol} -> ${s.text}`,
      ),
    )
    .join("\n");
}

/** Bracket depth of every character, used to shade the string in the ladder. */
export function depthMap(source: string): number[] {
  const out = new Array<number>(source.length);
  let d = 0;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === "[") {
      out[i] = d;
      d += 1;
    } else if (ch === "]") {
      d = Math.max(0, d - 1);
      out[i] = d;
    } else {
      out[i] = d;
    }
  }
  return out;
}
