"use client";

import { useMemo } from "react";
import PlantCanvas from "./PlantCanvas";
import { derive, interpret, parseRules } from "@/lib/lsystem";

/**
 * Figures for the opening sections, which are about the machinery rather than
 * about plants. A shrub with leaves on it is a distraction when the point
 * being made is what a bracket does, so these are all bare geometry.
 */

function Figure({
  axiom,
  rules,
  steps,
  angle,
  startAngle = 0,
  caption,
}: {
  axiom: string;
  rules: string;
  steps: number;
  angle: number;
  startAngle?: number;
  caption: string;
}) {
  const drawing = useMemo(() => {
    const { rules: parsed } = parseRules(rules);
    const gens = derive(axiom, parsed, steps);
    return interpret(gens[gens.length - 1] ?? "", {
      angle,
      step: 1,
      startAngle,
      budget: 20_000,
    });
  }, [axiom, rules, steps, angle, startAngle]);

  return (
    <figure className="demo">
      <PlantCanvas
        drawing={drawing}
        roughness={1}
        merge
        seed={steps * 13 + Math.round(angle)}
        title={caption}
      />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/**
 * Rewriting, shown geometrically: the same production applied none, once and
 * twice. This is von Koch's construction, and it is where the whole method
 * comes from.
 */
export function KochSequence() {
  return (
    <div className="demo-pair demo-3">
      {[0, 1, 2].map((n) => (
        <Figure
          key={n}
          axiom="F-F-F-F"
          rules="F -> F-F+F+FF-F-F+F"
          steps={n}
          angle={90}
          caption={n === 0 ? "the axiom" : `${n} pass${n > 1 ? "es" : ""}`}
        />
      ))}
    </div>
  );
}

/**
 * The turtle, shown by holding the word still and changing only δ. Ten
 * forward steps with a turn between each: at 60° that closes into a hexagon,
 * at 90° it retraces a square, at 144° it makes a star. Same letters, in the
 * same order, every time.
 */
export function TurtleAngles() {
  const word = "F+F+F+F+F+F+F+F+F+F";
  return (
    <div className="demo-pair demo-3">
      {[60, 90, 144].map((angle) => (
        <Figure
          key={angle}
          axiom={word}
          rules=""
          steps={0}
          angle={angle}
          caption={`δ = ${angle}°`}
        />
      ))}
    </div>
  );
}

/**
 * What the brackets do, put as plainly as it can be put: the same eight
 * letters, once with a pair of brackets and once without.
 */
export function BracketPair() {
  return (
    <div className="demo-pair demo-2">
      <Figure
        axiom="FF+FF-FF"
        rules=""
        steps={0}
        angle={40}
        startAngle={90}
        caption="FF+FF−FF"
      />
      <Figure
        axiom="FF[+FF][-FF]FF"
        rules=""
        steps={0}
        angle={40}
        startAngle={90}
        caption="FF[+FF][−FF]FF"
      />
    </div>
  );
}
