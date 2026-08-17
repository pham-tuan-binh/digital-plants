/**
 * Graphite on paper, drawn to a canvas.
 *
 * The stroke model here follows the one Bole Chen wrote for `doodles-faces`
 * (github.com/bolechen/doodles-faces, MIT), with the shading fills adapted
 * from Kevin's `cyber-crowd` (github.com/kengocodes/cyber-crowd, MIT).
 *
 * The important idea in both: a hand-drawn line is not a stroked path. It is a
 * filled ribbon whose spine wanders by a few octaves of sine, whose width
 * swells in the middle and lifts at the ends, and whose edges are broken up by
 * flecks of ink and flecks of paper. Stroking a path can never look like this.
 */

export type Pt = [number, number];
export type Rng = () => number;

export type InkOptions = {
  width?: number;
  alpha?: number;
  closed?: boolean;
  /** Smooth the point list before drawing. */
  smooth?: boolean;
  /** Lay a faint, thinner second pass over the first. */
  ghost?: boolean;
  /** Speckle the edges. Off for very small marks, where it just muddies. */
  grain?: boolean;
  color?: string;
};

const INK: [number, number, number] = [42, 39, 33];
const PAPER: [number, number, number] = [247, 243, 234];

export function inkA(a: number): string {
  return `rgba(${INK[0]},${INK[1]},${INK[2]},${Math.min(1, Math.max(0, a))})`;
}

function paperA(a: number): string {
  return `rgba(${PAPER[0]},${PAPER[1]},${PAPER[2]},${a})`;
}

/** Deterministic RNG, so the same plant is drawn the same way every time. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------- geometry ---

export function resample(pts: Pt[], step: number): Pt[] {
  if (pts.length < 2) return pts.slice();
  const out: Pt[] = [[pts[0][0], pts[0][1]]];
  let need = step;
  for (let i = 1; i < pts.length; i++) {
    let x0 = pts[i - 1][0];
    let y0 = pts[i - 1][1];
    const x1 = pts[i][0];
    const y1 = pts[i][1];
    let d = Math.hypot(x1 - x0, y1 - y0);
    while (d >= need && d > 0) {
      const t = need / d;
      x0 += (x1 - x0) * t;
      y0 += (y1 - y0) * t;
      out.push([x0, y0]);
      d = Math.hypot(x1 - x0, y1 - y0);
      need = step;
    }
    need -= d;
  }
  const last = pts[pts.length - 1];
  const end = out[out.length - 1];
  if (Math.hypot(last[0] - end[0], last[1] - end[1]) > step * 0.25) {
    out.push([last[0], last[1]]);
  }
  return out;
}

export function chaikin(pts: Pt[], closed: boolean, iterations: number): Pt[] {
  let cur = pts;
  let it = iterations;
  while (it-- > 0) {
    const out: Pt[] = [];
    const n = cur.length;
    if (n < 3) return cur;
    if (!closed) out.push(cur[0]);
    const end = closed ? n : n - 1;
    for (let i = 0; i < end; i++) {
      const a = cur[i];
      const b = cur[(i + 1) % n];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    if (!closed) out.push(cur[n - 1]);
    cur = out;
  }
  return cur;
}

function bbox(pts: Pt[]): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

function trace(ctx: CanvasRenderingContext2D, pts: Pt[], closed: boolean) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (closed) ctx.closePath();
}

// ---------------------------------------------------------------- stroke ---

/** Lay one graphite mark along the given points. */
export function ink(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  r: Rng,
  o: InkOptions = {},
): void {
  const w = o.width ?? 2.4;
  const alpha = o.alpha ?? 0.62 + r() * 0.26;
  const closed = Boolean(o.closed);
  const path = o.smooth === false ? pts.slice() : chaikin(pts, closed, 1);
  if (path.length < 2) return;

  const rs = resample(path, Math.max(2, w * 0.9));
  const n = rs.length;

  if (n < 3) {
    ctx.save();
    ctx.strokeStyle = o.color ?? inkA(alpha);
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    trace(ctx, path, closed);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Three octaves of wander along the normal, plus a swell along the length.
  const amp = w * 0.5 + 0.8;
  const p1 = r() * 7;
  const p2 = r() * 7;
  const p3 = r() * 7;
  const p4 = r() * 7;
  const f1 = 1.5 + r() * 2;
  const f2 = 5 + r() * 4;
  const f3 = 11 + r() * 6;
  const taper = 0.24;

  const left: Pt[] = [];
  const right: Pt[] = [];
  const spine: { x: number; y: number; nx: number; ny: number; half: number }[] =
    [];

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = rs[Math.max(0, i - 1)];
    const b = rs[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]);
    let ny = b[0] - a[0];
    const d = Math.hypot(nx, ny) || 1;
    nx /= d;
    ny /= d;

    const off =
      amp *
      (0.55 * Math.sin(t * f1 * 2 + p1) +
        0.3 * Math.sin(t * f2 + p2) +
        0.15 * Math.sin(t * f3 + p3));
    const px = rs[i][0] + nx * off + (r() - 0.5) * 0.6;
    const py = rs[i][1] + ny * off + (r() - 0.5) * 0.6;

    // Pressure: light where the pencil lands and lifts, heavy in between.
    const edge = closed ? 1 : Math.min(t, 1 - t) / taper;
    const s = edge < 1 ? edge * edge * (3 - 2 * edge) : 1;
    const half = Math.max(
      0.26,
      (w / 2) *
        (0.32 + 0.68 * s) *
        (1 + 0.34 * Math.sin(t * 7.3 + p4) + 0.13 * Math.sin(t * 19 + p2)) *
        (0.88 + r() * 0.24),
    );

    left.push([px + nx * half, py + ny * half]);
    right.push([px - nx * half, py - ny * half]);
    spine.push({ x: px, y: py, nx, ny, half });
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fillStyle = o.color ?? inkA(alpha * 0.66);
  ctx.fill();

  // The tooth of the paper: ink caught on the ridges, paper showing through.
  if (o.grain !== false && w >= 1.1) {
    for (const c of spine) {
      const nd = Math.min(3, Math.max(1, Math.round(c.half * 1.4)));
      for (let k = 0; k < nd; k++) {
        if (r() < 0.34) continue;
        const u = r() * 2.1 - 1.05;
        const sz = 0.6 + r() * 0.7;
        ctx.fillStyle = inkA(alpha * (0.18 + r() * 0.32));
        ctx.fillRect(
          c.x + c.nx * c.half * u - sz / 2,
          c.y + c.ny * c.half * u - sz / 2,
          sz,
          sz,
        );
      }
      if (r() < 0.4) {
        const u = (r() < 0.5 ? 1 : -1) * (0.8 + r() * 0.35);
        const sz = 0.8 + r() * 0.9;
        ctx.fillStyle = paperA(0.35 + r() * 0.4);
        ctx.fillRect(
          c.x + c.nx * c.half * u - sz / 2,
          c.y + c.ny * c.half * u - sz / 2,
          sz,
          sz,
        );
      }
    }
  }
  ctx.restore();

  if (o.ghost && r() < 0.5) {
    ink(ctx, pts, r, {
      ...o,
      width: w * 0.44,
      alpha: alpha * 0.2,
      ghost: false,
      grain: false,
    });
  }
}

// ---------------------------------------------------------------- shading ---

/** Parallel pencil strokes clipped to a shape. */
export function hatchFill(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  r: Rng,
  spacing: number,
  angle: number,
  alpha: number,
  width = 0.9,
): void {
  if (pts.length < 3) return;
  const [x0, y0, x1, y1] = bbox(pts);
  const diag = Math.hypot(x1 - x0, y1 - y0);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;

  ctx.save();
  trace(ctx, pts, true);
  ctx.clip();

  const px = Math.cos(angle + Math.PI / 2);
  const py = Math.sin(angle + Math.PI / 2);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const n = Math.ceil(diag / spacing);

  for (let i = -n; i <= n; i++) {
    const t = i * spacing + (r() - 0.5) * spacing * 0.4;
    ink(
      ctx,
      [
        [cx + px * t - dx * diag * 0.6, cy + py * t - dy * diag * 0.6],
        [cx + px * t + dx * diag * 0.6, cy + py * t + dy * diag * 0.6],
      ],
      r,
      { width, alpha: alpha * (0.6 + r() * 0.5), grain: false },
    );
  }
  ctx.restore();
}

/**
 * Knock a shape back out to the paper colour before drawing it.
 *
 * On paper, a petal in front simply hides the one behind. Line art without
 * that occlusion reads as a wire model, however good the strokes are.
 */
export function fillPaper(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  alpha = 1,
): void {
  if (pts.length < 3) return;
  const path = chaikin(pts, true, 1);
  ctx.save();
  ctx.fillStyle = paperA(alpha);
  trace(ctx, path, true);
  ctx.fill();
  ctx.restore();
}

/** Loose dots clipped to a shape — for a seed head. */
export function stippleFill(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  r: Rng,
  spacing: number,
  alpha: number,
): void {
  if (pts.length < 3) return;
  const [x0, y0, x1, y1] = bbox(pts);
  const n = ((x1 - x0) * (y1 - y0)) / (spacing * spacing);

  ctx.save();
  trace(ctx, pts, true);
  ctx.clip();
  for (let i = 0; i < n; i++) {
    const sz = 0.7 + r() * 1.1;
    ctx.fillStyle = inkA(alpha * (0.5 + r() * 0.7));
    ctx.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), sz, sz);
  }
  ctx.restore();
}

/**
 * A wash of colour laid inside a shape.
 *
 * Printed botanical plates were inked in black and coloured from a second
 * stone, and the two never quite lined up. Two offset, wobbling passes at low
 * opacity give that: colour that sits beside its outline rather than in it.
 */
export function wash(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  colour: string,
  r: Rng,
  alpha = 0.2,
  spread = 1,
): void {
  if (pts.length < 3) return;
  for (let pass = 0; pass < 2; pass++) {
    const dx = (r() - 0.5) * 2.6 * spread;
    const dy = (r() - 0.5) * 2.6 * spread;
    const grow = 1 + (r() - 0.5) * 0.06;
    let cx = 0;
    let cy = 0;
    for (const [x, y] of pts) {
      cx += x;
      cy += y;
    }
    cx /= pts.length;
    cy /= pts.length;

    const path = chaikin(
      pts.map(
        ([x, y]) =>
          [cx + (x - cx) * grow + dx, cy + (y - cy) * grow + dy] as Pt,
      ),
      true,
      1,
    );
    ctx.save();
    ctx.globalAlpha = alpha * (pass === 0 ? 1 : 0.55);
    ctx.fillStyle = colour;
    trace(ctx, path, true);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * A dab of watercolour.
 *
 * There is no outline anywhere in here, on purpose. A brush loaded with
 * pigment and touched to damp paper does four things at once, and all four are
 * done with fills:
 *
 *   the wash spreads past where the brush went, softest at the fringe;
 *   pigment migrates outward as the water dries, so the rim ends up darker
 *     than the middle, which is the pale heart left behind;
 *   the paper drinks unevenly, so the colour granulates into speckles;
 *   and a few blooms creep away from the mass where the paper was wettest.
 *
 * Blurring the fills is what makes the edge look wet. Stroking it would put
 * the outline straight back, which is the one thing a wash never has.
 */
export function dab(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  colour: string,
  r: Rng,
  o: { alpha?: number; granulate?: boolean; bleed?: number } = {},
): void {
  if (pts.length < 3) return;
  const alpha = o.alpha ?? 0.3;
  const bleed = o.bleed ?? 1;

  let cx = 0;
  let cy = 0;
  for (const [x, y] of pts) {
    cx += x;
    cy += y;
  }
  cx /= pts.length;
  cy /= pts.length;

  let reach = 0;
  for (const [x, y] of pts) reach += Math.hypot(x - cx, y - cy);
  reach /= pts.length;

  const soft = Math.max(0.9, reach * 0.15) * bleed;
  const canBlur = typeof ctx.filter === "string";

  const shift = (grow: number, dx: number, dy: number) =>
    chaikin(
      pts.map(
        ([x, y]) =>
          [cx + (x - cx) * grow + dx, cy + (y - cy) * grow + dy] as Pt,
      ),
      true,
      2,
    );

  ctx.save();
  ctx.fillStyle = colour;

  // The body of the wash, in three passes. The first is the damp halo that
  // spread past the brush; the second is the wash proper; the third is nearly
  // sharp, because part of every dab dries against dry paper and keeps an
  // edge. Without that last one the whole thing reads as out of focus.
  const body: { blur: number; grow: number; alpha: number }[] = [
    { blur: soft * 1.6, grow: 1.06, alpha: alpha * 0.42 },
    { blur: soft * 0.7, grow: 0.99, alpha: alpha * 0.72 },
    { blur: 0.35, grow: 0.88, alpha: alpha * 0.5 },
  ];
  for (const layer of body) {
    if (canBlur) ctx.filter = `blur(${layer.blur.toFixed(2)}px)`;
    ctx.globalAlpha = layer.alpha;
    trace(
      ctx,
      shift(
        layer.grow + (r() - 0.5) * 0.05,
        (r() - 0.5) * reach * 0.12,
        (r() - 0.5) * reach * 0.12,
      ),
      true,
    );
    ctx.fill();
  }

  // Blooms creeping off the edge, where the paper stayed wet longest.
  for (let i = 0; i < 2; i++) {
    const a = r() * Math.PI * 2;
    const d = reach * (0.75 + r() * 0.5);
    if (canBlur) ctx.filter = `blur(${(soft * 2.2).toFixed(2)}px)`;
    ctx.globalAlpha = alpha * (0.14 + r() * 0.16);
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(a) * d,
      cy + Math.sin(a) * d,
      reach * (0.16 + r() * 0.26),
      0,
      7,
    );
    ctx.fill();
  }

  // The pale heart. Lifting pigment out of the middle is what leaves it
  // pooled around the rim, and it costs no line to do.
  if (canBlur) ctx.filter = `blur(${(soft * 1.5).toFixed(2)}px)`;
  ctx.globalAlpha = 0.18 + r() * 0.1;
  ctx.fillStyle = paperA(1);
  trace(
    ctx,
    shift(
      0.42 + r() * 0.16,
      (r() - 0.5) * reach * 0.5,
      (r() - 0.5) * reach * 0.5,
    ),
    true,
  );
  ctx.fill();

  // Granulation: pigment settling into the tooth of the paper.
  if (o.granulate !== false) {
    if (canBlur) ctx.filter = "none";
    ctx.fillStyle = colour;
    for (let i = 0; i < 7; i++) {
      const a = r() * Math.PI * 2;
      const d = reach * (0.15 + r() * 0.8);
      ctx.globalAlpha = alpha * (0.25 + r() * 0.45);
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(a) * d,
        cy + Math.sin(a) * d,
        reach * (0.04 + r() * 0.1),
        0,
        7,
      );
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * The footprint of a brush pressed to paper: a lopsided blob.
 *
 * Deliberately not the silhouette of a leaf or a petal. A dab is a dab, and
 * a handful of them in roughly the right places says "leaf" better than an
 * accurate outline ever does.
 */
export function splotch(
  r: Rng,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation = 0,
  rough = 1,
  n = 22,
): Pt[] {
  const p1 = r() * 7;
  const p2 = r() * 7;
  const p3 = r() * 7;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const pts: Pt[] = [];

  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const m =
      1 +
      rough *
        (0.2 * Math.sin(t * 2 + p1) +
          0.13 * Math.sin(t * 3 + p2) +
          0.08 * Math.sin(t * 5 + p3) +
          (r() - 0.5) * 0.12);
    const x = Math.cos(t) * rx * m;
    const y = Math.sin(t) * ry * m;
    pts.push([cx + x * cosR - y * sinR, cy + x * sinR + y * cosR]);
  }
  return chaikin(pts, true, 1);
}

/** A wandering closed outline — used for discs and buds. */
export function blobPts(
  r: Rng,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n = 16,
): Pt[] {
  const ph = r() * 7;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const m = 1 + 0.12 * Math.sin(t * 2 + ph) + 0.07 * Math.sin(t * 5 + ph * 2.3);
    pts.push([cx + Math.cos(t) * rx * m, cy + Math.sin(t) * ry * m]);
  }
  return chaikin(pts, true, 1);
}

// ------------------------------------------------------- strokes to draw ---

import type { Segment } from "./lsystem";

export type CanvasStroke = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  /** How many source segments this mark stands for. */
  count: number;
  srcFirst: number;
  srcLast: number;
};

/**
 * Join runs of straight, touching segments into one mark.
 *
 * A rule like `F -> FF` splits a line into dozens of collinear pieces. Drawn
 * separately they average out into a mechanical hairline; drawn as one long
 * mark the hand shows.
 */
export function mergeCollinearPts(
  segments: Segment[],
  merge: boolean,
): CanvasStroke[] {
  if (!merge) {
    return segments.map((s) => ({
      x1: s.x1,
      y1: s.y1,
      x2: s.x2,
      y2: s.y2,
      depth: s.depth,
      count: 1,
      srcFirst: s.srcIndex,
      srcLast: s.srcIndex,
    }));
  }

  const out: CanvasStroke[] = [];
  let cur: CanvasStroke | null = null;
  let dx0 = 0;
  let dy0 = 0;

  for (const s of segments) {
    const dx = s.x2 - s.x1;
    const dy = s.y2 - s.y1;
    const len = Math.hypot(dx, dy) || 1e-9;
    const ux = dx / len;
    const uy = dy / len;

    const joins =
      cur !== null &&
      cur.depth === s.depth &&
      Math.abs(cur.x2 - s.x1) < 1e-6 &&
      Math.abs(cur.y2 - s.y1) < 1e-6 &&
      ux * dx0 + uy * dy0 > 0.9995;

    if (joins && cur) {
      cur.x2 = s.x2;
      cur.y2 = s.y2;
      cur.count += 1;
      cur.srcLast = s.srcIndex;
    } else {
      cur = {
        x1: s.x1,
        y1: s.y1,
        x2: s.x2,
        y2: s.y2,
        depth: s.depth,
        count: 1,
        srcFirst: s.srcIndex,
        srcLast: s.srcIndex,
      };
      out.push(cur);
      dx0 = ux;
      dy0 = uy;
    }
  }
  return out;
}
