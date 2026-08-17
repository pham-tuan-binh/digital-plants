"use client";

import { useMemo } from "react";
import PlantCanvas from "./PlantCanvas";
import { derive, interpret, parseRules } from "@/lib/lsystem";

const AXIOM = "X";
const RULES = "X -> F[+X][-X]FX\nF -> FF";
const STEPS = 5;
const ANGLE = 25.7;

export default function HeroPlant() {
  const drawing = useMemo(() => {
    const { rules } = parseRules(RULES);
    const gens = derive(AXIOM, rules, STEPS);
    return interpret(gens[gens.length - 1] ?? "", {
      angle: ANGLE,
      step: 1,
      budget: 8000,
    });
  }, []);

  return (
    <PlantCanvas
      drawing={drawing}
      roughness={1.1}
      merge
      title="A plant grown from one letter"
    />
  );
}
