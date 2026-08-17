"use client";

import FloraFigure from "./FloraFigure";
import { PageHead, Plate } from "./Scene";
import { TET } from "@/lib/flora";

/** The two trees of the new year, with what they are and why they matter. */
export default function Tet() {
  return (
    <>
      <div className="scene-story">
        <PageHead
          title="Tết"
          rubric="Two trees, and the one week of the year they are grown for."
        />
        <p className="lead">
          Tết Nguyên Đán is the Vietnamese lunar new year, the turn from the
          old year into the first morning of spring, and the week when a
          country of ninety million people goes home. Houses are swept and
          debts are settled before it, because whatever the first day finds is
          what the year will hold. A tree is brought inside for it, in bloom,
          and it is not decoration: a branch that flowers on the first morning
          is the household&rsquo;s luck for the year, and one that opens late
          or not at all is remarked on.
        </p>
        <p>
          Which tree depends on where you are. In the south it is{" "}
          <em>hoa mai</em>, the yellow apricot, whose five flat petals are the
          colour of the season there. In the north, where it is cold enough for
          the wood to need a winter, it is <em>hoa đào</em>, peach blossom, and
          the pink is deeper the harder the cold was. Both are cut and forced
          so that they open on time.
        </p>
        <p>
          Both drop their leaves before they flower, and that is why they end
          this book. A blossoming branch is almost pure structure. There is
          nothing on it to look at except the branching itself, and so nearly
          everything you see below is the production, running.
        </p>
      </div>

      {TET.map((plant) => (
        <div key={plant.id}>
          <div className="scene-story">
            <p className="movement">
              <span className="movement-n">{plant.name}</span>
              <span className="movement-count">
                {plant.latin}, the {plant.english}
              </span>
            </p>
            <p>{plant.note}</p>
          </div>

          <Plate
            caption={`${plant.name}, grown from these rules.`}
            system={{
              axiom: plant.axiom,
              rules: plant.rules,
              angle: plant.turtle.angle,
              steps: plant.steps,
            }}
          >
            <FloraFigure plant={plant} />
          </Plate>
        </div>
      ))}
    </>
  );
}
