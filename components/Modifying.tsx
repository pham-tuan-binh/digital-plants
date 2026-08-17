"use client";

import { useMemo, useState } from "react";
import PlantCanvas from "./PlantCanvas";
import { PageHead, Plate } from "./Scene";
import { derive, interpret, parseRules } from "@/lib/lsystem";
import { CURVE_PRESETS, PLANT_PRESETS, type Preset } from "@/lib/presets";

/**
 * One production, changed one symbol at a time.
 *
 * Following the book's own demonstration: take a system that works, insert,
 * delete or move a single symbol, and draw what comes out. Nothing here is
 * chosen by the reader; the sequence makes the point on its own.
 */
type Modification = {
  id: string;
  heading: string;
  note: React.ReactNode;
  rules: string;
  angle: number;
  steps: number;
};

const MODIFICATIONS: Modification[] = [
  {
    id: "given",
    heading: "As given",
    note: (
      <>
        The system from the last page, unaltered: one production, a turn of
        25.7°, four passes. Everything below is this and one small change.
      </>
    ),
    rules: "F -> F[+F]F[-F]F",
    angle: 25.7,
    steps: 4,
  },
  {
    id: "deleted",
    heading: "One symbol deleted",
    note: (
      <>
        Remove the <code>F</code> between the two brackets, leaving{" "}
        <code>F[+F][−F]F</code>. The branches now leave from the same point
        rather than one above the other, and a plant that climbed becomes a
        plant that spreads.
      </>
    ),
    rules: "F -> F[+F][-F]F",
    angle: 25.7,
    steps: 4,
  },
  {
    id: "moved",
    heading: "One bracket moved",
    note: (
      <>
        Put the right-hand branch inside the left one:{" "}
        <code>F[+F[−F]F]F</code>. Nothing was added or taken away, only
        renested, and the plant loses its symmetry entirely.
      </>
    ),
    rules: "F -> F[+F[-F]F]F",
    angle: 25.7,
    steps: 4,
  },
  {
    id: "narrow",
    heading: "The same rule at 12°",
    note: (
      <>
        Now leave the production alone and change only the turtle. A narrow
        turn gathers the whole plant into a spire, and no rule was touched to
        do it.
      </>
    ),
    rules: "F -> F[+F]F[-F]F",
    angle: 12,
    steps: 4,
  },
  {
    id: "wide",
    heading: "The same rule at 60°",
    note: (
      <>
        A wide one throws it open until the branches begin to cross. The
        topology is identical in all three of these. Only the geometry differs,
        which is the whole point of keeping the two apart.
      </>
    ),
    rules: "F -> F[+F]F[-F]F",
    angle: 60,
    steps: 4,
  },
];

export default function Modifying() {
  return (
    <>
      <div className="scene-story">
        <PageHead
          title="Modifying"
          rubric="The ease of changing an L-system is most of its usefulness."
        />
        <p className="lead">
          The ease of modifying L-systems makes them suitable for developing
          new forms: start from one that works, and observe the results of
          inserting, deleting or replacing some symbols. What follows is one
          production put through exactly that, a symbol at a time.
        </p>
      </div>

      {MODIFICATIONS.map((m) => (
        <Variant key={m.id} mod={m} />
      ))}

      <Editor />
    </>
  );
}

function Variant({ mod }: { mod: Modification }) {
  const drawing = useMemo(() => {
    const { rules } = parseRules(mod.rules);
    const gens = derive("F", rules, mod.steps);
    return interpret(gens[gens.length - 1] ?? "", {
      angle: mod.angle,
      step: 1,
      budget: 12_000,
    });
  }, [mod]);

  return (
    <>
      <div className="scene-story">
        <p className="movement">
          <span className="movement-n">{mod.heading}</span>
        </p>
        <p>{mod.note}</p>
        <pre className="notation">{mod.rules}</pre>
      </div>

      <Plate caption={`${mod.rules}   at ${mod.angle}°`}>
        <PlantCanvas
          drawing={drawing}
          roughness={1.05}
          merge
          anchor="bottom"
          seed={mod.id.charCodeAt(0)}
          title={mod.heading}
        />
      </Plate>
    </>
  );
}

/* ------------------------------------------------------------- the editor -- */

const START: Preset = PLANT_PRESETS[3];
const ALL = [...PLANT_PRESETS, ...CURVE_PRESETS];

function Editor() {
  const [axiom, setAxiom] = useState(START.axiom);
  const [rulesText, setRulesText] = useState(START.rules);
  const [angle, setAngle] = useState(START.turtle.angle);
  const [steps, setSteps] = useState(START.steps);
  const [presetId, setPresetId] = useState(START.id);

  const { rules, errors } = useMemo(() => parseRules(rulesText), [rulesText]);

  const text = useMemo(() => {
    const gens = derive(axiom, rules, steps);
    return gens[gens.length - 1] ?? "";
  }, [axiom, rules, steps]);

  const drawing = useMemo(
    () =>
      interpret(text, {
        angle,
        step: 1,
        startAngle: 90,
        budget: 24_000,
      }),
    [text, angle],
  );

  function load(p: Preset) {
    setPresetId(p.id);
    setAxiom(p.axiom);
    setRulesText(p.rules);
    setAngle(p.turtle.angle);
    setSteps(p.steps);
  }

  return (
    <>
      <div className="scene-story">
        <p className="movement">
          <span className="movement-n">Your turn</span>
        </p>
        <p>
          The three fields below are the whole of an L-system. Change any of
          them and the plate redraws. Most edits produce a tangle, which is
          worth seeing too, because it shows how narrow the band of
          plant-shaped rules really is.
        </p>

        <p className="field-lead">Begin from one of these, or write your own.</p>
        <div className="chips">
          {ALL.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chip${presetId === p.id ? " is-on" : ""}`}
              onClick={() => load(p)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <label className="field">
          <span className="field-label">
            The axiom, which is the word rewriting starts from
          </span>
          <input
            className="input mono"
            value={axiom}
            spellCheck={false}
            onChange={(e) => {
              setAxiom(e.target.value);
              setPresetId("");
            }}
          />
        </label>

        <label className="field">
          <span className="field-label">
            The productions, one to a line, written as{" "}
            <code>F -&gt; F[+F]F</code>
          </span>
          <textarea
            className="input mono textarea"
            value={rulesText}
            rows={3}
            spellCheck={false}
            onChange={(e) => {
              setRulesText(e.target.value);
              setPresetId("");
            }}
          />
        </label>

        {errors.length > 0 && (
          <ul className="errors">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        <div className="dials">
          <Slider
            label="How far a turn goes"
            value={angle}
            min={0}
            max={120}
            step={0.5}
            suffix="°"
            onChange={setAngle}
          />
          <Slider
            label="How many passes of rewriting"
            value={steps}
            min={0}
            max={10}
            step={1}
            onChange={setSteps}
          />
        </div>
      </div>

      <Plate
        caption={`${text.length.toLocaleString()} symbols, ${drawing.segments.length.toLocaleString()} strokes${
          drawing.truncated ? ", and it stopped early; try fewer passes" : ""
        }`}
      >
        <PlantCanvas
          drawing={drawing}
          roughness={1}
          merge
          title="Your L-system, drawn"
        />
      </Plate>
    </>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="field slider">
      <span className="field-label">
        {label}
        <b className="field-value">
          {value}
          {suffix}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}
