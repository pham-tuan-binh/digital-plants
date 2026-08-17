"use client";

import { useMemo } from "react";
import { depthMap } from "@/lib/lsystem";

type Props = {
  text: string;
  active?: number | null;
  onActiveChange?: (index: number | null) => void;
  /** Stop drawing glyphs past this point and fade out instead. */
  limit?: number;
  className?: string;
};

function classOf(ch: string) {
  if ("FGABS".includes(ch)) return "g-draw";
  if ("fg".includes(ch)) return "g-move";
  if ("+-|".includes(ch)) return "g-turn";
  if ("[]".includes(ch)) return "g-branch";
  if ("LK".includes(ch)) return "g-organ";
  return "g-bud";
}

export default function DerivationString({
  text,
  active = null,
  onActiveChange,
  limit = 2600,
  className,
}: Props) {
  const depths = useMemo(() => depthMap(text), [text]);
  const clipped = text.length > limit;
  const shown = clipped ? text.slice(0, limit) : text;
  const interactive = Boolean(onActiveChange);

  return (
    <p className={`glyphs${clipped ? " is-clipped" : ""} ${className ?? ""}`}>
      {Array.from(shown, (ch, i) => (
        <span
          key={i}
          className={`glyph ${classOf(ch)}${active === i ? " is-lit" : ""}`}
          style={{ ["--g-depth" as string]: String(depths[i]) }}
          onMouseEnter={interactive ? () => onActiveChange?.(i) : undefined}
          onMouseLeave={interactive ? () => onActiveChange?.(null) : undefined}
        >
          {ch}
        </span>
      ))}
      {clipped && (
        <span className="glyph-more">
          + {(text.length - limit).toLocaleString()} more
        </span>
      )}
    </p>
  );
}
