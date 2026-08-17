"use client";

import { useMemo } from "react";
import PlantCanvas from "./PlantCanvas";
import { PageHead, Plate } from "./Scene";
import { derive, interpret, parseRules } from "@/lib/lsystem";
import { TREES, type Tree } from "@/lib/trees";

/** All four trees, in order, each with the rules that made it. */
export default function TreeGallery() {
  return (
    <>
      <div className="scene-story">
        <PageHead
          title="Four trees"
          rubric="One question, asked four ways: what does a shoot do after it forks?"
        />
        <p className="lead">
          A tree is a branching structure with a limited amount of growth to
          spend, and every set of rules below is a different answer to the same
          two questions. Does the leading shoot carry on after it forks, or
          hand everything to its children? And how much shorter is a side
          branch than the branch it came from?
        </p>
        <p>
          Add a pull toward the light and a little unsteadiness at every joint,
          and the species falls out of the arithmetic. A tree that always hands
          over builds a wide, shallow crown, because each generation of limbs
          is shorter than the last and there are twice as many of them. A tree
          that never hands over builds a spire, because one shoot keeps the
          whole budget and the rest are trimmed to spurs. Everything between
          those is a matter of how the odds are set.
        </p>
      </div>

      {TREES.map((tree) => (
        <Specimen key={tree.id} tree={tree} />
      ))}
    </>
  );
}

function Specimen({ tree }: { tree: Tree }) {
  const drawing = useMemo(() => {
    const { rules } = parseRules(tree.rules);
    const gens = derive(tree.axiom, rules, tree.steps, tree.seed);
    return interpret(gens[gens.length - 1] ?? "", {
      step: 1,
      budget: 9000,
      seed: tree.seed,
      ...tree.turtle,
    });
  }, [tree]);

  return (
    <>
      <div className="scene-story">
        <p className="movement">
          <span className="movement-n">{tree.name}</span>
        </p>
        <p>{tree.note}</p>
        <pre className="notation" aria-label={`The rules for ${tree.name}`}>
          {tree.axiom}
          {"\n"}
          {tree.rules}
        </pre>
      </div>

      <Plate caption={tree.name}>
        <PlantCanvas
          drawing={drawing}
          roughness={1.1}
          merge
          anchor="bottom"
          seed={tree.seed}
          title={tree.name}
        />
      </Plate>
    </>
  );
}
