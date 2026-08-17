"use client";

import { useMemo } from "react";
import PlantCanvas from "./PlantCanvas";
import { interpret } from "@/lib/lsystem";
import { growFlora, type Flora } from "@/lib/flora";

/** Grow one named plant from its own rules. */
export function useFlora(plant: Flora, seed = plant.seed) {
  return useMemo(() => {
    const grown = growFlora(plant, seed);
    return interpret(grown.word, {
      step: 1,
      budget: 12_000,
      seed: grown.seed,
      ...plant.turtle,
    });
  }, [plant, seed]);
}

export default function FloraFigure({
  plant,
  seed = plant.seed,
  weight = 1,
  padding,
  anchor = "bottom",
}: {
  plant: Flora;
  seed?: number;
  weight?: number;
  padding?: number;
  anchor?: "center" | "bottom";
}) {
  const drawing = useFlora(plant, seed);
  return (
    <PlantCanvas
      drawing={drawing}
      roughness={1.1}
      merge
      anchor={anchor}
      padding={padding}
      seed={seed}
      weight={weight}
      flower={plant.flower}
      petals={plant.petals}
      heartScale={plant.heartScale}
      rings={plant.rings}
      stemColour={plant.stemColour}
      title={plant.name}
    />
  );
}
