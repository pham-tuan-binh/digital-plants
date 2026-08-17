"use client";

import { useMemo } from "react";
import PlantCanvas from "./PlantCanvas";
import { PageHead, Plate } from "./Scene";
import {
  derive,
  interpret,
  parseRules,
  type TurtleOptions,
} from "@/lib/lsystem";

type Demo = {
  caption: string;
  axiom: string;
  rules: string;
  steps: number;
  seed?: number;
  turtle: Partial<TurtleOptions> & { angle: number };
};

type Habit = {
  id: string;
  title: string;
  body: React.ReactNode;
  demos: Demo[];
};

/** Four habits, each shown in turn with the figure that makes the point. */
const HABITS: Habit[] = [
  {
    id: "branch",
    title: "Branch, and come back",
    body: (
      <>
        A stem that puts out a leaf does not lose its place. Wrap the side
        shoot in brackets, <code>F[+L]</code>, and the turtle returns to the
        stem to keep climbing. Alternate the sign of the turn and the leaves
        alternate with it, which is both commoner in nature than opposite pairs
        and far less mechanical to look at.
      </>
    ),
    demos: [
      {
        caption: "A → F[+L]F[−L]A",
        axiom: "A",
        rules: "A -> F[+L]F[-L]A",
        steps: 8,
        turtle: { angle: 58, leafSize: 1.5, tropism: 2 },
      },
    ],
  },
  {
    id: "bloom",
    title: "Stop growing, to bloom",
    body: (
      <>
        A flower is what a stem does when it stops making stem. Give the
        growing tip two productions, one that carries on and one that finishes,
        and it will run for a while and then open. That is not a trick to get
        variety: it is a real botanical switch, and it only goes one way. A bud
        is either vegetative or floral, and once it has chosen it cannot go
        back.
      </>
    ),
    demos: [
      {
        caption: "P → F[+L][−L]P, or P → FK",
        axiom: "P",
        rules: "P -> 0.74 : F[+L][-L]P\nP -> 0.26 : FFK",
        steps: 9,
        seed: 5,
        turtle: { angle: 46, leafSize: 1.4, flowerSize: 1.8, tropism: 2 },
      },
    ],
  },
  {
    id: "grass",
    title: "Grass is one long, patient turn",
    body: (
      <>
        A blade of grass has no branches at all. It is <code>S → F−S</code>:
        draw a little, turn a little, repeat. Thirty passes of that make a
        single arc. The whole character of it is in the size of the angle, and
        the two figures below differ in nothing else.
      </>
    ),
    demos: [
      {
        caption: "at 2.4° a blade",
        axiom: "S",
        rules: "S -> F-S",
        steps: 30,
        turtle: { angle: 2.4 },
      },
      {
        caption: "at 9° a shepherd's crook",
        axiom: "S",
        rules: "S -> F-S",
        steps: 30,
        turtle: { angle: 9 },
      },
    ],
  },
  {
    id: "wobble",
    title: "Nothing grows straight",
    body: (
      <>
        Two last touches, and they matter more than any production. The first
        is a wobble: add a degree or two at random to every turn the turtle
        makes. In a branching plant that error compounds, because a twig
        inherits the error of the limb it came from and adds its own, which is
        exactly how a real branch accumulates its crookedness. The second is
        tropism: after every step, bend the heading a fraction back toward the
        light. One is noise and the other is a force, and the two together are
        the whole difference between the pair below, which otherwise run the
        same production for the same number of passes.
      </>
    ),
    demos: [
      {
        caption: "exact turns, no light",
        axiom: "A",
        rules: "A -> F[+A]F[-A]FA",
        steps: 5,
        turtle: { angle: 22 },
      },
      {
        caption: "±12° at each turn, and a sun",
        axiom: "A",
        rules: "A -> F[+A]F[-A]FA",
        steps: 5,
        seed: 91,
        turtle: { angle: 22, jitter: 12, tropism: 6 },
      },
    ],
  },
];

export default function Principles() {
  return (
    <>
      <div className="scene-story">
        <PageHead
          title="Growth"
          rubric="Four habits that separate a drawing of a plant from a diagram of one."
        />
        <p className="lead">
          Everything so far makes shapes. It does not yet make anything that
          looks grown. The distance between the two is smaller than it seems,
          and comes down to four habits, each of which is a single change to
          rules you already have.
        </p>
      </div>

      {HABITS.map((habit) => (
        <Habit key={habit.id} habit={habit} />
      ))}
    </>
  );
}

function Habit({ habit }: { habit: Habit }) {
  const drawings = useMemo(
    () =>
      habit.demos.map((d) => {
        const { rules } = parseRules(d.rules);
        const gens = derive(d.axiom, rules, d.steps, d.seed ?? 3);
        return {
          caption: d.caption,
          drawing: interpret(gens[gens.length - 1] ?? "", {
            step: 1,
            budget: 8000,
            seed: d.seed ?? 3,
            ...d.turtle,
          }),
        };
      }),
    [habit],
  );

  return (
    <>
      <div className="scene-story">
        <p className="movement">
          <span className="movement-n">{habit.title}</span>
        </p>
        <p>{habit.body}</p>
      </div>

      <Plate>
        <div className={`demo-pair demo-${drawings.length}`}>
          {drawings.map((d, i) => (
            <figure key={i} className="demo">
              <PlantCanvas
                drawing={d.drawing}
                roughness={1.15}
                merge
                anchor="bottom"
                seed={(habit.id.charCodeAt(0) + i * 7) % 97}
                title={d.caption}
              />
              <figcaption>{d.caption}</figcaption>
            </figure>
          ))}
        </div>
      </Plate>
    </>
  );
}
