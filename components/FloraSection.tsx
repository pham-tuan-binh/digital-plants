"use client";

import FloraFigure from "./FloraFigure";
import { PageHead, Plate } from "./Scene";
import { GARDEN, type Flora } from "@/lib/flora";

/**
 * Every species on its own, in order.
 *
 * One plant to a plate, with the productions that made it printed underneath,
 * because the whole claim of the book is that the second thing is sufficient
 * for the first.
 */
export default function FloraSection() {
  return (
    <>
      <div className="scene-story">
        <PageHead
          title="A Vietnamese flora"
          rubric="Eight plants, each from a different structural idea rather than a different set of numbers."
        />
        <p className="lead">
          What separates one species from the next is not colour and not size
          but what its production is willing to do. Whether a shoot may divide
          or only extend. Whether the two arms of a fork get equal shares of
          what is left. Whether anything at all pulls the result back toward
          the light. Those three questions decide almost everything about a
          plant&rsquo;s shape, and each of the eight below answers them
          differently. The two Tết trees answer them too, and get a section of
          their own at the end.
        </p>
      </div>

      {GARDEN.map((plant) => (
        <Specimen key={plant.id} plant={plant} />
      ))}
    </>
  );
}

function Specimen({ plant }: { plant: Flora }) {
  return (
    <>
      <div className="scene-story">
        <p className="movement">
          <span className="movement-n">{plant.name}</span>
          <span className="movement-count">
            {plant.latin}, the {plant.english}
          </span>
        </p>
        <p>{plant.note}</p>
        <p>{plant.structure}</p>
      </div>

      <Plate
        caption={plant.name}
        system={{
          axiom: plant.axiom,
          rules: plant.rules,
          angle: plant.turtle.angle,
          steps: plant.steps,
        }}
      >
        <FloraFigure plant={plant} />
      </Plate>
    </>
  );
}
