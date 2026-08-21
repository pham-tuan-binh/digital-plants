"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PlantCanvas from "@/components/PlantCanvas";
import { depthMap } from "@/lib/lsystem";
import { pending } from "@/lib/schedule";
import type { Pass } from "./derivation";
import {
  BOUQUET,
  FPS,
  FRAMES,
  HERO,
  beatAt,
  shotAt,
  type Movement,
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
 */
function Word({
  text,
  mark,
  limit = 1900,
}: {
  text: string;
  mark: (i: number) => "" | " is-struck" | " is-fresh";
  limit?: number;
}) {
  const depths = useMemo(() => depthMap(text), [text]);
  const clipped = text.length > limit;
  const shown = clipped ? text.slice(0, limit) : text;

  return (
    <p className="glyphs">
      {Array.from(shown, (ch, i) => (
        <span
          key={i}
          className={`glyph ${classOf(ch)}${mark(i)}`}
          style={{ ["--g-depth" as string]: String(depths[i]) }}
        >
          {ch}
        </span>
      ))}
      {clipped && (
        <span className="glyph-more">
          {" "}
          + {(text.length - limit).toLocaleString()} more
        </span>
      )}
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
  // The plant draws itself over the first two thirds of the shot and is then
  // held; the titling comes up under it once there is something to title.
  // A stroke or two is already down on the first frame, because a film whose
  // opening frame is blank paper has a blank paper for a poster.
  const grow = ease(clamp01((local + 3) / (length * 0.62)));
  const lift = ease(clamp01((local - 22) / 26));

  return (
    <div className="shot-title">
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
      <p className="title-line" style={{ opacity: lift }}>
        Rewrite a string of symbols, hand it to a turtle, and a plant appears.
      </p>
    </div>
  );
}

function Flora({ movement, local }: { movement: Movement; local: number }) {
  const beat = beatAt(movement, local);
  const { plant } = movement;
  const pass: Pass | null = beat.pass;

  const mark = useMemo(() => {
    if (!pass) return () => "" as const;
    if (beat.striking) {
      const struck = pass.replaced;
      return (i: number) => (struck.has(i) ? (" is-struck" as const) : ("" as const));
    }
    const spans = pass.written;
    return (i: number) => (inSpans(spans, i) ? (" is-fresh" as const) : ("" as const));
  }, [pass, beat.striking]);

  const accent = plant.flower?.outer ?? "#8a8577";

  return (
    <div
      className="shot-flora"
      style={{ ["--accent" as string]: accent, opacity: beat.opened }}
    >
      <div className="flora-plate">
        <PlantCanvas
          drawing={beat.rung.drawing}
          reveal={beat.reveal}
          roughness={1.1}
          merge
          anchor="bottom"
          seed={movement.seed}
          flower={plant.flower}
          petals={plant.petals}
          heartScale={plant.heartScale}
          rings={plant.rings}
          stemColour={plant.stemColour}
          title={plant.name}
        />
      </div>

      <div className="flora-side">
        <p className="flora-name">{plant.name}</p>
        <p className="flora-latin">
          {plant.latin}, the {plant.english}
        </p>

        <p className="flora-system">
          <b>ω</b>
          {plant.axiom}
          {"\n"}
          {plant.rules.split("\n").map((line, i) => (
            <span key={i}>
              {i === 0 ? <b>P</b> : <b> </b>}
              {line.replace(/->/g, "→")}
              {"\n"}
            </span>
          ))}
          <b>δ</b>
          {plant.turtle.angle}°
        </p>

        <div className="flora-word">
          <Word text={beat.rung.word} mark={mark} />
        </div>

        <p className="flora-count">
          n = {beat.n} &middot; {beat.rung.word.length.toLocaleString()}{" "}
          {beat.rung.word.length === 1 ? "symbol" : "symbols"} &middot;{" "}
          {beat.reveal.toLocaleString()}{" "}
          {beat.reveal === 1 ? "stroke" : "strokes"}
        </p>
      </div>
    </div>
  );
}

function Bed({ local }: { local: number }) {
  const lift = ease(clamp01(local / 18));
  return (
    <div className="shot-bed" style={{ opacity: lift }}>
      <p className="bed-head">A Vietnamese flora</p>
      <p className="bed-rubric">
        Fifteen plants, and a different production behind every one.
      </p>
      <div className="bed-grid">
        {BOUQUET.map(({ plant, drawing, seed }, i) => {
          // They come up left to right, a few frames apart.
          const t = ease(clamp01((local - 6 - i * 3) / 22));
          return (
            <div className="bed-cell" key={plant.id}>
              <div className="bed-fig">
                <PlantCanvas
                  drawing={drawing}
                  reveal={Math.round(t * drawing.segments.length)}
                  roughness={1.1}
                  merge
                  anchor="bottom"
                  seed={seed}
                  weight={0.95}
                  flower={plant.flower}
                  petals={plant.petals}
                  heartScale={plant.heartScale}
                  rings={plant.rings}
                  stemColour={plant.stemColour}
                  title={plant.name}
                />
              </div>
              <p className="bed-name" style={{ opacity: t }}>
                {plant.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- film -- */

const ROMAN = ["i", "ii", "iii", "iv", "v"];

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
 */
async function settle() {
  for (let i = 0; i < 3; i++) await raf();
  for (let guard = 0; guard < 1200; guard++) {
    if (pending() === 0) {
      await raf();
      if (pending() === 0) return;
    }
    await raf();
  }
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
      /** Put frame `i` on the screen, and resolve once it is fully drawn. */
      seek: async (i: number) => {
        captured.current = true;
        setFrame(i);
        await settle();
        return i;
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
        <p className="film-mark">Digital Plant</p>
        {shot.kind === "flora" && (
          <p className="film-tally">{ROMAN[shot.index]} of v</p>
        )}
        {shot.kind === "title" ? (
          <Title local={local} length={shot.length} />
        ) : shot.kind === "flora" ? (
          <Flora movement={shot.movement} local={local} />
        ) : (
          <Bed local={local} />
        )}
        <div className="film-foot">
          <span>l-systems.binhph.am</span>
          <span>
            after Prusinkiewicz &amp; Lindenmayer, The Algorithmic Beauty of
            Plants
          </span>
        </div>
      </div>
    </div>
  );
}
