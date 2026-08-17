import type { ReactNode } from "react";

/** One page of the book. */
export default function Scene({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="scene" id={id} data-label={label} aria-label={label}>
      <div className="scene-inner">{children}</div>
    </section>
  );
}

/**
 * The head of a page: a hair rule, the title, and a line of summary beneath.
 * No number — the folio at the foot says which page you are on.
 */
export function PageHead({
  title,
  rubric,
}: {
  title: string;
  /** The old habit of summarising a page in one line under its title. */
  rubric?: string;
}) {
  return (
    <header className="page-head">
      <h2 className="page-title">{title}</h2>
      {rubric && <p className="page-rubric">{rubric}</p>}
    </header>
  );
}

/** Everything needed to grow a figure again from scratch. */
export type System = {
  axiom: string;
  rules?: string;
  angle?: number;
  steps?: number;
};

/**
 * A plate: the drawing, its numbered caption, and the system that made it.
 *
 * The rules are printed under every figure on purpose. A picture of a plant
 * is worth very little here; what is worth something is the half-dozen
 * symbols it came from, and a reader should never have to take those on
 * trust or go hunting for them.
 */
export function Plate({
  n,
  caption,
  system,
  children,
}: {
  n?: number;
  caption?: string;
  system?: System;
  children: ReactNode;
}) {
  return (
    <figure className="scene-figure">
      {children}
      {(caption || system) && (
        <figcaption className="plate-caption">
          {caption && (
            <span className="plate-said">
              {n !== undefined && (
                <span className="plate-num">Fig.&nbsp;{n}</span>
              )}
              {caption}
            </span>
          )}
          {system && (
            <span className="plate-system">
              {`ω : ${system.axiom}`}
              {system.rules ? `\n${system.rules}` : ""}
              {system.angle !== undefined || system.steps !== undefined
                ? `\n${[
                    system.angle !== undefined ? `δ = ${system.angle}°` : "",
                    system.steps !== undefined ? `n = ${system.steps}` : "",
                  ]
                    .filter(Boolean)
                    .join(",  ")}`
                : ""}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/** A printer's flower, used to break a page without starting a new one. */
export function Fleuron() {
  return (
    <p className="fleuron" aria-hidden>
      ❧
    </p>
  );
}
