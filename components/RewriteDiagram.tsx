"use client";

/**
 * Shows one pass of rewriting with every symbol replaced at the same moment —
 * the single thing that separates an L-system from an ordinary grammar.
 */

const INPUT = "F[+F]F";
const RULE = new Map([["F", "F[+F]F"]]);

export default function RewriteDiagram() {
  const cells = Array.from(INPUT, (ch) => ({
    ch,
    out: RULE.get(ch) ?? ch,
    rewritten: RULE.has(ch),
  }));

  return (
    <div className="rewrite">
      <div className="rewrite-row rewrite-in">
        {cells.map((c, i) => (
          <span
            key={i}
            className={`cell${c.rewritten ? " is-active" : " is-kept"}`}
          >
            {c.ch}
          </span>
        ))}
      </div>

      <div className="rewrite-arrows" aria-hidden>
        {cells.map((c, i) => (
          <span key={i} className={`arrow${c.rewritten ? " is-active" : ""}`}>
            ↓
          </span>
        ))}
      </div>

      <div className="rewrite-row rewrite-out">
        {cells.map((c, i) => (
          <span
            key={i}
            className={`cell${c.rewritten ? " is-active" : " is-kept"}`}
          >
            {c.out}
          </span>
        ))}
      </div>

      <p className="rewrite-caption">
        All six symbols are replaced in the same instant. Nothing waits its
        turn, which is exactly how a plant grows, every bud pushing at once.
      </p>
    </div>
  );
}
