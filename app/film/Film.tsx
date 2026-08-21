"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PlantCanvas from "@/components/PlantCanvas";
import { depthMap } from "@/lib/lsystem";
import { pending } from "@/lib/schedule";
import type { Pass } from "./derivation";
import {
  CUES,
  DISSOLVE,
  FPS,
  FRAMES,
  HERO,
  TITLED,
  beatAt,
  lineAt,
  shotAt,
  type Shot,
} from "./score";
import "./film.css";

/* --------------------------------------------------------------- glyphs -- */

function classOf(ch: string) {
  if ("FGABS".includes(ch)) return "g-draw";
  if ("fg".includes(ch)) return "g-move";
  if ("+-|".includes(ch)) return "g-turn";
  if ("[]".includes(ch)) return "g-branch";
  if ("LK".includes(ch)) return "g-organ";
  return "g-bud";
}

/**
 * The word, with this pass's business marked on it.
 *
 * `mark` says what each letter is: struck, meaning a production is about to
 * replace it, or fresh, meaning a production has just written it. Everything
 * else is set the way the book sets a derivation.
 *
 * A word too long for its well is not counted or cut off — it simply runs
 * out of the bottom of the page and fades, which says "there is more of this
 * than will fit" without putting another number on the screen.
 */
function Word({
  text,
  mark,
}: {
  text: string;
  mark: (i: number) => "" | " is-struck" | " is-fresh";
}) {
  const depths = useMemo(() => depthMap(text), [text]);

  return (
    <p className="glyphs">
      {Array.from(text, (ch, i) => (
        <span
          key={i}
          className={`glyph ${classOf(ch)}${mark(i)}`}
          style={{ ["--g-depth" as string]: String(depths[i]) }}
        >
          {ch}
        </span>
      ))}
    </p>
  );
}

/** Which span of the new word a given letter falls in, by binary search. */
function inSpans(spans: [number, number][], i: number): boolean {
  let lo = 0;
  let hi = spans.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (i < spans[mid][0]) hi = mid - 1;
    else if (i >= spans[mid][1]) lo = mid + 1;
    else return true;
  }
  return false;
}

/* ---------------------------------------------------------------- shots -- */

function Title({ local, length }: { local: number; length: number }) {
  // The plant draws itself over the first half of the shot and is then held;
  // the titling comes up under it once there is something to title. A stroke
  // or two is already down on the first frame, because a film whose opening
  // frame is blank paper has a blank paper for a poster.
  const grow = ease(clamp01((local + 3) / (length * 0.52)));
  const lift = ease(clamp01((local - TITLED + 18) / 30));
  const said = ease(clamp01((local - TITLED - 4) / 34));
  const fade = ease(clamp01((length - local) / DISSOLVE));

  return (
    <div className="shot-title" style={{ opacity: fade }}>
      <div className="title-plate">
        <PlantCanvas
          drawing={HERO}
          reveal={Math.round(grow * HERO.segments.length)}
          roughness={1.1}
          merge
          title="A plant grown from one letter"
        />
      </div>
      <p className="title-name" style={{ opacity: lift }}>
        Digital Plant
      </p>
      <p className="title-quote" style={{ opacity: said }}>
        Organic form itself is found, mathematically speaking, to be a function
        of time. We might call the form of an organism an event in space-time,
        and not merely a configuration in space.
        <span className="title-attrib">D&rsquo;Arcy Thompson</span>
      </p>
    </div>
  );
}

function Flora({ shot, local }: { shot: Extract<Shot, { kind: "flora" }>; local: number }) {
  const beat = beatAt(shot, local);
  const { plant } = shot.movement;
  const pass: Pass | null = beat.pass;

  // Struck while the pass is being announced, fresh once it has been made.
  const mark = !pass
    ? () => "" as const
    : beat.striking
      ? (i: number) =>
          pass.replaced.has(i) ? (" is-struck" as const) : ("" as const)
      : (i: number) =>
          inSpans(pass.written, i) ? (" is-fresh" as const) : ("" as const);

  return (
    <div
      className="shot-flora"
      style={{
        ["--accent" as string]: plant.flower?.outer ?? "#8a8577",
        // The marking washes in and out rather than snapping on, which is
        // most of what makes a pass read as something happening.
        ["--wash" as string]: `${(46 * beat.wash).toFixed(1)}%`,
        ["--wash-ink" as string]: `${(15 * beat.wash).toFixed(1)}%`,
        ["--rule-ink" as string]: `${(15 * beat.wash).toFixed(1)}%`,
        opacity: beat.fade,
      }}
    >
      <div className="flora-plate">
        <PlantCanvas
          drawing={beat.rung.drawing}
          reveal={beat.reveal}
          roughness={1.1}
          merge
          anchor="bottom"
          seed={shot.movement.seed}
          flower={plant.flower}
          petals={plant.petals}
          heartScale={plant.heartScale}
          rings={plant.rings}
          stemColour={plant.stemColour}
          title={plant.name}
        />
      </div>

      <div className="flora-side">
        <p className="flora-name" style={{ opacity: beat.named }}>
          {plant.name}
        </p>
        <p className="flora-latin" style={{ opacity: beat.named }}>
          {plant.latin}, the {plant.english}
        </p>

        <p className="flora-system">
          {shot.movement.system.map((line, i) => (
            <span
              className="sys-line"
              key={i}
              style={{ opacity: lineAt(beat.ruled, i) }}
            >
              <b>{line.mark}</b>
              {line.text}
            </span>
          ))}
        </p>

        <div className="flora-word" style={{ opacity: beat.worded }}>
          <Word text={beat.rung.word} mark={mark} />
        </div>

        <p className="flora-count" style={{ opacity: beat.worded }}>
          n = {beat.n} &middot; {beat.rung.word.length.toLocaleString()}{" "}
          {beat.rung.word.length === 1 ? "symbol" : "symbols"}
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- film -- */

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

const raf = () =>
  new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * Wait until nothing on the page has any drawing left to do.
 *
 * Plates paint themselves a slice of a frame at a time out of one shared
 * queue, so the frame after a cut is not the frame the plate finishes on.
 * The camera waits for the queue to run dry twice over before it fires.
 *
 * Returns how many turns that took, or -1 if the drawing never stopped. The
 * camera is told rather than left to photograph a half-drawn plate.
 */
async function settle(): Promise<number> {
  for (let i = 0; i < 3; i++) await raf();
  for (let guard = 0; guard < 2000; guard++) {
    if (pending() === 0) {
      await raf();
      if (pending() === 0) return guard;
    }
    await raf();
  }
  return -1;
}

export default function Film() {
  const [frame, setFrame] = useState(0);
  const [scale, setScale] = useState(1);
  // A visitor gets the film played to them; the camera takes it over.
  const captured = useRef(false);

  useEffect(() => {
    const fit = () =>
      setScale(
        Math.min(window.innerWidth / 1920, window.innerHeight / 1080),
      );
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const w = window as unknown as { __film?: unknown };
    w.__film = {
      frames: FRAMES,
      fps: FPS,
      /** When each rewrite sounds, and what it sounds like. */
      cues: CUES,
      /** Put frame `i` on the screen, and resolve once it is fully drawn. */
      seek: async (i: number) => {
        captured.current = true;
        setFrame(i);
        return settle();
      },
    };
    return () => {
      delete w.__film;
    };
  }, []);

  useEffect(() => {
    let live = true;
    let id = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (!live) return;
      if (!captured.current) {
        setFrame(Math.floor(((now - start) / 1000) * FPS) % FRAMES);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      live = false;
      cancelAnimationFrame(id);
    };
  }, []);

  const { shot, local } = shotAt(frame);

  return (
    <div className="film-fit" style={{ ["--film-scale" as string]: scale }}>
      <div className="film-stage">
        {shot.kind === "title" ? (
          <Title local={local} length={shot.length} />
        ) : (
          <Flora shot={shot} local={local} />
        )}
      </div>
    </div>
  );
}
