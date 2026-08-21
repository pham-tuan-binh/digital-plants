/**
 * The derivation, with a record of what each pass touched.
 *
 * `lib/lsystem` rewrites a word and hands back the result, which is all a
 * plate ever needs. The film needs one thing more: which letters were struck
 * out on a pass, and which stretch of the new word was written in their
 * place. That is the whole point of the middle panel, so it is worked out
 * here rather than guessed at from the two strings.
 *
 * The random stream is stepped exactly as `derive` steps it — one generator
 * for the whole derivation, drawn from only when a symbol has more than one
 * successor — so a ladder built here is the same ladder the site draws.
 */

import { mulberry32, parseRules, type Rule } from "@/lib/lsystem";

export type Pass = {
  /** The word this pass started from. */
  from: string;
  /** The word it produced. */
  to: string;
  /** Positions in `from` that a production struck out. */
  replaced: Set<number>;
  /** Half-open spans of `to` that a production wrote. */
  written: [number, number][];
};

export type Ladder = {
  /** Every generation, `words[0]` being the axiom. */
  words: string[];
  /** One entry per rewrite; passes that changed nothing are dropped. */
  passes: Pass[];
};

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

function pass(input: string, rules: Rule[], rand: () => number): Pass {
  const table = new Map<string, Rule>();
  for (const r of rules) if (r.symbol) table.set(r.symbol[0], r);

  let out = "";
  const replaced = new Set<number>();
  const written: [number, number][] = [];

  for (let i = 0; i < input.length; i++) {
    const rule = table.get(input[i]);
    if (!rule || rule.successors.length === 0) {
      out += input[i]; // no production: the symbol stands for itself
      continue;
    }
    const text = pick(rule.successors, rand);
    replaced.add(i);
    if (text.length > 0) written.push([out.length, out.length + text.length]);
    out += text;
  }

  return { from: input, to: out, replaced, written };
}

/**
 * Walk a system for `steps` passes.
 *
 * A stochastic rule can settle on a successor that rewrites to itself, after
 * which every further pass is a copy. Those are dropped: a film that holds on
 * an unchanging word for four seconds is showing nothing.
 */
export function ladder(
  axiom: string,
  rulesText: string,
  steps: number,
  seed: number,
): Ladder {
  const { rules } = parseRules(rulesText);
  const rand = mulberry32(seed);

  const words = [axiom];
  const passes: Pass[] = [];
  // Every pass is taken, so the random stream is stepped exactly as `derive`
  // steps it and the words match the ones the site draws. The dead tail is
  // cut afterwards rather than by stopping short.
  for (let i = 0; i < steps; i++) {
    const p = pass(words[words.length - 1], rules, rand);
    passes.push(p);
    words.push(p.to);
  }
  while (passes.length > 0 && passes[passes.length - 1].to === passes[passes.length - 1].from) {
    passes.pop();
    words.pop();
  }
  return { words, passes };
}

/** The predecessors of a system — the letters a pass will strike out. */
export function predecessors(rulesText: string): Set<string> {
  const { rules } = parseRules(rulesText);
  const out = new Set<string>();
  for (const r of rules) if (r.symbol && r.successors.length) out.add(r.symbol[0]);
  return out;
}
