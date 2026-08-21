/**
 * One drawing budget, shared by every plate on the page.
 *
 * Each plate painting itself incrementally is not enough. Forty of them each
 * taking a few milliseconds a frame is still forty times too much, and the
 * page stops scrolling while they do it. So no plate paints itself directly:
 * it hands over a job, and this queue hands back a slice of one frame's worth
 * of time, round robin, until the work is done.
 *
 * A job draws until the deadline passes and returns true if it has more left.
 */

export type PaintJob = (deadline: number) => boolean;

/** How much of a frame all the drawing on the page may take, together. */
const BUDGET_MS = 7;

const queue = new Set<PaintJob>();
let frame: number | null = null;
/** Where the last frame stopped, so the queue does not starve its tail. */
let cursor = 0;

function pump() {
  if (frame !== null || queue.size === 0) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    const deadline = performance.now() + BUDGET_MS;
    const jobs = [...queue];
    if (cursor >= jobs.length) cursor = 0;

    // Start where we left off, so a plate at the end of the queue is not
    // starved by the ones in front of it.
    for (let n = 0; n < jobs.length; n++) {
      if (performance.now() >= deadline) break;
      const job = jobs[(cursor + n) % jobs.length];
      if (!queue.has(job)) continue;
      let more = false;
      try {
        more = job(deadline);
      } catch {
        more = false;
      }
      if (!more) queue.delete(job);
      cursor = (cursor + n + 1) % Math.max(1, jobs.length);
    }
    pump();
  });
}

export function enqueue(job: PaintJob) {
  queue.add(job);
  pump();
}

export function dequeue(job: PaintJob) {
  queue.delete(job);
}

/**
 * How many plates still have drawing left to do.
 *
 * Nothing on the page asks this. The film capture does: it advances a frame,
 * waits for the queue to run dry, and only then takes the picture, so that no
 * frame is ever photographed half-drawn.
 */
export function pending(): number {
  return queue.size;
}
