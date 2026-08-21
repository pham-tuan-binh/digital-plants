"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Drawing, Ornament } from "@/lib/lsystem";
import { dequeue, enqueue } from "@/lib/schedule";
import {
  ink,
  stamp,
  mergeCollinearPts,
  rng,
  type Pt,
  type Rng,
} from "@/lib/ink";

type Props = {
  drawing: Drawing;
  active?: number | null;
  onActiveChange?: (index: number | null) => void;
  reveal?: number;
  padding?: number;
  className?: string;
  title?: string;
  roughness?: number;
  merge?: boolean;
  anchor?: "center" | "bottom";
  seed?: number;
  /** How heavily this plant is drawn. Lighter reads as further back. */
  weight?: number;
  /**
   * Wash the organs in colour. On by default: a grey wash reads as a smudge,
   * because what makes a wash legible is hue, not tone.
   */
  colour?: boolean;
  /** Paint the stems in this colour rather than drawing them in graphite. */
  stemColour?: string;
  /** Force a flower family, rather than letting the seed choose one. */
  flower?: FlowerHue;
  /** How many touches of the brush make one flower head. */
  petals?: number;
  /** How big the disc at the centre is, as a share of the head. */
  heartScale?: number;
  /** One ring of petals, or two set inside each other. */
  rings?: number;
};

/* Muted enough to sit on cream paper beside graphite. */
const GREENS = ["#6f8a4e", "#7d9457", "#5f7f45", "#8b9a63"];

/**
 * Each species gets a family, not a colour and a contrasting spot. The heart
 * is a deeper wash of the same pigment, which is what a second, wetter touch
 * of the same brush actually does. Ochre only appears where it belongs, in
 * the middle of a cream flower; on pink it reads as a sticker.
 */
export type FlowerHue = { outer: string; heart: string | null };
const FLOWERS: FlowerHue[] = [
  { outer: "#c9808c", heart: "#9d4753" },
  { outer: "#c2726f", heart: "#8f3c46" },
  { outer: "#ab8cb1", heart: "#6f5480" },
  { outer: "#dfd2b6", heart: "#bd9450" },
  { outer: "#d08d74", heart: "#a2553f" },
  { outer: "#b7c0d2", heart: "#6f7d99" },
  { outer: "#cf9db0", heart: null },
];

/* What the brush carries when a plate is left uncoloured. */
const PIGMENT = "#4a463d";
/**
 * Where a dense plate starts economising.
 *
 * Nothing ever falls back to a plain stroked line: a hairline vector does not
 * look like pencil at any size, and a reader should never meet one. What a
 * crowded figure gives up instead is the expensive part of the mark, the
 * speckled tooth and the ghosted second pass, keeping the tapered ribbon that
 * carries the character.
 */
const HEAVY = 1200;

export default function PlantCanvas({
  drawing,
  active = null,
  onActiveChange,
  reveal,
  padding = 0.09,
  className,
  title = "L-system figure",
  roughness = 1,
  merge = true,
  anchor = "center",
  seed = 7,
  weight = 1,
  colour = true,
  stemColour,
  flower,
  petals,
  heartScale,
  rings,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const hit = useRef<{ x: number; y: number; i: number; src: number }[]>([]);
  // Growth is monotonic, so a frame only has to lay down what is new since the
  // last one. Redrawing the whole plant sixty times a second was the lag.
  const laid = useRef({ strokes: 0, organs: 0, key: "" });
  const brush = useRef<Rng>(rng(1));
  const [grown, setGrown] = useState(reveal === undefined ? 0 : 1);
  // Whether this plate is anywhere near the reader. A book of forty plates at
  // full pixel ratio is a couple of hundred megabytes of canvas held open at
  // once, which is felt as sluggishness long before any frame is late.
  const [near, setNear] = useState(true);

  // Each plate draws itself when it is scrolled to, and only then. Watching
  // its own box rather than the section it sits in means a page can hold a
  // dozen figures and each one waits its turn.
  useEffect(() => {
    if (reveal !== undefined) return;
    const wrap = box.current;
    if (!wrap) return;
    let raf: number | null = null;

    const draw = () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced) {
        raf = requestAnimationFrame(() => setGrown(1));
        return;
      }
      // A big plant takes longer to come up than a seedling.
      const span = Math.min(2200, 950 + drawing.segments.length * 2.2);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / span);
        setGrown(t * t * (3 - 2 * t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          draw();
        }
      },
      // Start as the plate comes up, not once it is sitting there. Waiting
      // until it is well inside the viewport is what made it look like the
      // figure popped into existence rather than grew into view.
      { rootMargin: "0px 0px 8% 0px", threshold: 0.01 },
    );
    io.observe(wrap);

    return () => {
      io.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [reveal, drawing]);

  // Hand back the backing store of any plate that is a long way off, and take
  // it again when the reader comes back to it.
  useEffect(() => {
    const wrap = box.current;
    if (!wrap) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setNear(e.isIntersecting);
      },
      { rootMargin: "120% 0px 120% 0px", threshold: 0 },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (near || !cv) return;
    cv.width = 0;
    cv.height = 0;
    laid.current = { strokes: 0, organs: 0, key: "" };
  }, [near]);

  const shownUpTo =
    reveal !== undefined ? reveal : Math.round(grown * drawing.segments.length);

  const strokes = useMemo(
    () => mergeCollinearPts(drawing.segments, merge),
    [drawing.segments, merge],
  );

  const paint = useCallback((deadline: number): boolean => {
    const cv = canvas.current;
    const wrap = box.current;
    if (!cv || !wrap) return false;

    if (!near) return false;

    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    if (cw < 2 || ch < 2) return false;

    // Beyond about 1.5 the extra pixels buy nothing on a washed drawing, and
    // they cost a great deal of memory across a page this long.
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const sized = cv.width === cw * dpr && cv.height === ch * dpr;
    if (!sized) {
      // Writing to width or height wipes the canvas, so whatever was on it is
      // gone and the plate has to be laid down again from the first mark.
      // Without this the figure can end up permanently blank: the early
      // return below sees nothing new to draw and leaves the cleared canvas.
      cv.width = cw * dpr;
      cv.height = ch * dpr;
      cv.style.width = `${cw}px`;
      cv.style.height = `${ch}px`;
      laid.current.key = "";
    }

    const ctx = cv.getContext("2d");
    if (!ctx) return false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const b = drawing.bounds;
    const rawW = Math.max(b.maxX - b.minX, 0.001);
    const rawH = Math.max(b.maxY - b.minY, 0.001);
    const pad = Math.max(rawW, rawH) * padding;
    const bx0 = b.minX - pad;
    const by1 = b.maxY + pad;
    const bw = rawW + pad * 2;
    const bh = rawH + pad * 2;

    const s = Math.min(cw / bw, ch / bh);
    const ox = (cw - bw * s) / 2 - bx0 * s;
    const top = anchor === "bottom" ? ch - bh * s : (ch - bh * s) / 2;
    const oy = top + by1 * s;

    const P = (x: number, y: number): Pt => [ox + x * s, oy - y * s];

    // One nib width for the whole plate, scaled to how big it is drawn.
    const nib = Math.max(1.15, (Math.max(bw, bh) * s) / 300);

    // Anything but growing further means starting the plate again.
    const key = [
      cw,
      ch,
      strokes.length,
      padding,
      anchor,
      active,
      roughness,
      seed,
      weight,
      colour,
      stemColour,
      flower?.outer,
      flower?.heart,
      petals,
      heartScale,
      rings,
    ].join("|");
    const restart = key !== laid.current.key;
    if (restart) {
      ctx.clearRect(0, 0, cw, ch);
      laid.current = { strokes: 0, organs: 0, key };
      brush.current = rng(seed * 7919 + 13);
      hit.current = [];
    }
    const r = brush.current;

    // How much of the plant is showing this frame.
    let target = strokes.length;
    if (shownUpTo < drawing.segments.length) {
      let used = 0;
      target = 0;
      for (const st of strokes) {
        used += st.count;
        if (used > shownUpTo) break;
        target += 1;
      }
    }
    if (target < laid.current.strokes) {
      // Wound back, so start the plate again.
      ctx.clearRect(0, 0, cw, ch);
      laid.current = { strokes: 0, organs: 0, key };
      brush.current = rng(seed * 7919 + 13);
      hit.current = [];
    }

    const from = laid.current.strokes;
    if (
      target === from &&
      !restart &&
      laid.current.organs >= drawing.ornaments.length
    ) {
      return false;
    }

    let ranOut = false;

    // A drawing of three thousand marks puts far more graphite on the page
    // than one of thirty. Lighten and thin the stroke as the count climbs, or
    // a dense figure comes out as a black mass.
    const density = Math.max(0.5, Math.min(1, 700 / Math.max(1, strokes.length)) ** 0.35);

    // One plant, one flower: how many touches make a head, how loosely they
    // are thrown, and which family they are washed in, all fixed by the seed.
    const bloom = {
      hue: flower ?? FLOWERS[seed % FLOWERS.length],
      touches: petals ?? 3 + (seed % 4),
      scatter: 0.16 + ((seed >> 2) % 4) * 0.07,
      heart: heartScale ?? 0.13 + ((seed >> 3) % 3) * 0.05,
      rings: rings ?? 1,
    };

    // --- stems -----------------------------------------------------------
    const heavy = strokes.length > HEAVY;
    let drew = from;
    for (let i = from; i < target; i++) {
      // Check the clock every few marks rather than every one.
      // Check the clock every sixteenth mark rather than every one.
      if ((i & 15) === 0 && performance.now() >= deadline) {
        ranOut = true;
        break;
      }
      drew = i + 1;
      const st = strokes[i];
      const a = P(st.x1, st.y1);
      const c = P(st.x2, st.y2);
      hit.current.push({
        x: (a[0] + c[0]) / 2,
        y: (a[1] + c[1]) / 2,
        i,
        src: st.srcFirst,
      });
      const lit =
        active !== null && active >= st.srcFirst && active <= st.srcLast;
      const w = nib * Math.max(0.38, 2.7 - st.depth * 0.42) * density;
      ink(ctx, [a, c], r, {
        width: w * (lit ? 1.5 : 1),
        alpha: (lit ? 0.95 : (0.5 + r() * 0.22) * density) * weight,
        ghost: !heavy,
        grain: !heavy,
        smooth: false,
        color: stemColour,
      });
    }
    laid.current.strokes = drew;

    // --- organs ----------------------------------------------------------
    // A terminal flower sits after the last line the turtle drew, so once the
    // plant is fully out there is no later stroke to gate it against. Without
    // this, every bloom at the end of a word was silently dropped.
    const lastSrc =
      drew >= strokes.length
        ? Number.MAX_SAFE_INTEGER
        : target > 0
          ? strokes[target - 1].srcLast
          : -1;
    const leaves = drawing.ornaments.filter((o) => o.kind === "leaf").length;
    // How crowded the plate is with *flowers*. Counting leaves here meant a
    // leafy plant had its petals thinned as though it carried a hundred
    // blooms, which is why the sunflower came out with four rays.
    const bloomCount = drawing.ornaments.length - leaves;
    let seen = 0;
    for (let i = 0; i < drawing.ornaments.length; i++) {
      const o = drawing.ornaments[i];
      if (o.kind === "leaf") seen += 1;
      if (i < laid.current.organs) continue;
      if (o.srcIndex > lastSrc) break;

      // Give up before claiming the organ, never after. Marking it laid and
      // then running out of time lost it for good: the next slice skipped it
      // as already drawn, and a crowded plate came up as a bare tree with
      // every one of its flowers missing.
      if (performance.now() >= deadline) {
        ranOut = true;
        break;
      }
      laid.current.organs = i + 1;

      const lit = active === o.srcIndex;
      if (o.kind === "leaf") {
        const up = leaves > 1 ? (seen - 1) / (leaves - 1) : 0;
        drawLeaf(ctx, o, P, nib, r, lit, up, weight, colour);
      } else {
        drawBloom(
          ctx,
          o,
          P,
          nib,
          r,
          lit,
          bloomCount,
          weight,
          colour,
          bloom,
        );
      }
    }

    return ranOut;
  }, [
    drawing.bounds,
    drawing.ornaments,
    drawing.segments.length,
    strokes,
    padding,
    anchor,
    shownUpTo,
    active,
    roughness,
    seed,
    weight,
    colour,
    stemColour,
    flower,
    petals,
    heartScale,
    rings,
    near,
  ]);

  useEffect(() => {
    const job = (deadline: number) => paint(deadline);
    enqueue(job);
    return () => dequeue(job);
  }, [paint]);

  useEffect(() => {
    const wrap = box.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => enqueue((d) => paint(d)));
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [paint]);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onActiveChange || hit.current.length === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let best = -1;
      let bestD = 18 * 18;
      for (const h of hit.current) {
        const d = (h.x - mx) * (h.x - mx) + (h.y - my) * (h.y - my);
        if (d < bestD) {
          bestD = d;
          best = h.src;
        }
      }
      onActiveChange(best >= 0 ? best : null);
    },
    [onActiveChange],
  );

  return (
    <div
      className={`fig ${className ?? ""}`}
      ref={box}
      role="img"
      aria-label={title}
      onMouseMove={onActiveChange ? onMove : undefined}
      onMouseLeave={onActiveChange ? () => onActiveChange(null) : undefined}
    >
      <canvas ref={canvas} />
    </div>
  );
}

// ------------------------------------------------------------------ organs --

/**
 * A leaf: one dab of green, and nothing else.
 *
 * No blade outline, no midrib, no vein. It is a lopsided blob of colour set
 * at the angle the stem put it, sized by where it sits on the stalk. The eye
 * fills in the rest, and does it more kindly than any silhouette I can draw.
 */
function drawLeaf(
  ctx: CanvasRenderingContext2D,
  o: Ornament,
  P: (x: number, y: number) => Pt,
  nib: number,
  r: Rng,
  lit: boolean,
  /** 0 at the base of the stalk, 1 at its tip. */
  up: number,
  weight: number,
  colour: boolean,
) {
  // Lower leaves are older and larger, and they sit a little lower.
  const taper = 1 - 0.38 * up;
  const droop = (1 - up) * 0.3 + (r() - 0.5) * 0.34;
  const lean = o.angle - droop * Math.sign(Math.sin(o.angle) || 1);
  const size = o.size * taper * (0.85 + r() * 0.35);

  const along = size * 0.52;
  const cos = Math.cos(lean);
  const sin = Math.sin(lean);
  const at = (u: number, v: number): Pt =>
    P(o.x + u * cos - v * sin, o.y + u * sin + v * cos);

  // A short stalk in pencil, so the dab is attached to something.
  ink(ctx, [at(0, 0), at(size * 0.2, 0)], r, {
    width: nib * 0.45,
    alpha: 0.4 * weight,
    smooth: false,
  });

  const centre = at(along, 0);
  const edge = at(along + size * 0.4, 0);
  const across = at(along, size * 0.3);
  const rx = Math.max(1.5, Math.hypot(edge[0] - centre[0], edge[1] - centre[1]));
  const ry = Math.max(
    1.2,
    Math.hypot(across[0] - centre[0], across[1] - centre[1]),
  );
  const tilt = Math.atan2(edge[1] - centre[1], edge[0] - centre[0]);

  stamp(
    ctx,
    colour ? GREENS[Math.floor(r() * GREENS.length)] : PIGMENT,
    r,
    centre[0],
    centre[1],
    rx,
    ry,
    tilt,
    (lit ? 0.62 : 0.46) * weight,
  );
}

/**
 * A flower: a loose cluster of dabs with a wetter one at the middle.
 *
 * Not petals arranged on a circle. Three to five overlapping touches of the
 * brush, thrown slightly off centre, which is what a flower looks like when
 * somebody paints one quickly and well.
 */
function drawBloom(
  ctx: CanvasRenderingContext2D,
  o: Ornament,
  P: (x: number, y: number) => Pt,
  nib: number,
  r: Rng,
  lit: boolean,
  crowd: number,
  weight: number,
  colour: boolean,
  style: {
    hue: FlowerHue;
    touches: number;
    scatter: number;
    heart: number;
    rings: number;
  },
) {
  const R = o.size;
  const cos0 = Math.cos(o.angle);
  const sin0 = Math.sin(o.angle);
  const at = (u: number, v: number): Pt =>
    P(o.x + u * cos0 - v * sin0, o.y + u * sin0 + v * cos0);

  // The head sits a little off the end of its stem, and leans.
  const lift = R * 0.5;
  const sway = (r() - 0.5) * R * 0.3;
  const heart = at(lift, sway);
  const stemTop = at(0, 0);

  ink(ctx, [stemTop, heart], r, {
    width: nib * 0.6,
    alpha: 0.42 * weight,
    smooth: false,
  });

  // Scale from drawing units into page units, using a known offset.
  const unitProbe = at(lift + R, sway);
  const unit =
    Math.max(2, Math.hypot(unitProbe[0] - heart[0], unitProbe[1] - heart[1])) /
    R;

  const touches = crowd > 18 ? 3 : style.touches;
  const pigment = colour ? style.hue.outer : PIGMENT;
  const alpha = (lit ? 0.44 : 0.31) * weight;

  // Petals, not a spatter. Each touch takes its own share of the circle and
  // is laid down pointing outward: the eye reads radial symmetry long before
  // it reads colour, and that is most of what says "flower".
  const spin = r() * Math.PI * 2;
  const disc = R * unit * style.heart;

  for (let ring = style.rings - 1; ring >= 0; ring--) {
    const outer = ring === style.rings - 1;
    const scale = outer ? 1 : 0.66;
    // The inner ring sits between the petals of the outer one.
    const offset = outer ? 0 : Math.PI / touches;
    const count = outer ? touches : Math.max(3, Math.round(touches * 0.7));

    for (let i = 0; i < count; i++) {
      const a = spin + offset + (i / count) * Math.PI * 2 + (r() - 0.5) * 0.4;
      const long = (R * unit * (0.36 + r() * 0.18)) * scale;
      const wide = long * (0.44 + r() * 0.22);
      // A petal starts at the rim of the disc and reaches outward from it.
      const reach = disc * 0.8 + long * 0.85;
      stamp(
        ctx,
        pigment,
        r,
        heart[0] + Math.cos(a) * reach,
        heart[1] + Math.sin(a) * reach,
        long,
        wide,
        a,
        alpha * (outer ? 1.35 : 1.5),
      );
    }
  }

  // The middle: a second, wetter touch of a deeper wash. Some flowers have
  // no distinct eye at all, and those are left alone.
  const eyeHue = colour ? style.hue.heart : PIGMENT;
  if (eyeHue) {
    stamp(
      ctx,
      eyeHue,
      r,
      heart[0],
      heart[1],
      disc,
      disc * 0.88,
      r() * Math.PI,
      0.68 * weight,
    );
  }
}
