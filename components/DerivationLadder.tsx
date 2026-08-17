"use client";

import { useMemo, useState } from "react";
import DerivationString from "./DerivationString";
import PlantCanvas from "./PlantCanvas";
import { PageHead, Plate } from "./Scene";
import { derive, interpret, parseRules } from "@/lib/lsystem";
import { LADDER } from "@/lib/presets";

/**
 * Every derivation in order, rather than a control that shows one at a time.
 * Reading down the page is the animation.
 */
export default function DerivationLadder() {
  const generations = useMemo(() => {
    const { rules } = parseRules(LADDER.rules);
    return derive(LADDER.axiom, rules, 5);
  }, []);

  return (
    <>
      <div className="scene-story">
        <PageHead
          title="Derivation"
          rubric="A word is generated in a derivation of length n. Each pass below is one more."
        />
        <p className="lead">
          Here is the whole apparatus running, from the axiom to the fifth
          rewrite. The system could hardly be smaller: the axiom is a single{" "}
          <code>F</code>, the only production is{" "}
          <code>F → F[+F]F[−F]F</code>, and the turtle turns 25.7° at every{" "}
          <code>+</code> and <code>−</code>. Nothing else is specified, and
          nothing else is needed.
        </p>
        <p>
          Read the words as much as the plants. The plant on any line is
          nothing but the line of letters above it, handed to the turtle. Hover
          a letter to find the stroke it made, or a stroke to find its letter.
        </p>
      </div>

      {generations.map((text, n) => (
        <Rung key={n} n={n} text={text} />
      ))}

      <div className="scene-story">
        <p>
          Five passes take one symbol to fifteen thousand, and one line to a
          plant that fills the page. The production never changed and never
          grew. This is the whole economy of the method, and it is why so
          little text can stand for something that looks so complicated.
        </p>
      </div>
    </>
  );
}

function Rung({ n, text }: { n: number; text: string }) {
  const [active, setActive] = useState<number | null>(null);

  const drawing = useMemo(
    () =>
      interpret(text, {
        angle: LADDER.turtle.angle,
        step: 1,
        budget: 20_000,
      }),
    [text],
  );

  return (
    <>
      <div className="scene-story">
        <p className="movement">
          <span className="movement-n">
            {n === 0 ? "The axiom" : `After ${n} ${n === 1 ? "pass" : "passes"}`}
          </span>
          <span className="movement-count">
            {text.length.toLocaleString()}{" "}
            {text.length === 1 ? "symbol" : "symbols"},{" "}
            {drawing.segments.length.toLocaleString()}{" "}
            {drawing.segments.length === 1 ? "stroke" : "strokes"}
          </span>
        </p>
        <div className="string-well">
          <DerivationString
            text={text}
            active={active}
            onActiveChange={setActive}
            limit={2400}
          />
        </div>
      </div>

      <Plate>
        <PlantCanvas
          drawing={drawing}
          active={active}
          onActiveChange={setActive}
          title={`The plant after ${n} rewrites`}
          roughness={1.1}
        />
      </Plate>
    </>
  );
}
