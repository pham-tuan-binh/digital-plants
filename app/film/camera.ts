"use client";

/**
 * What the camera talks to.
 *
 * The page draws whichever frame it is asked for and says when it has
 * finished drawing it; `scripts/render-film.mjs` walks the frames one at a
 * time and photographs each. Left alone with nobody photographing it, the
 * page just plays.
 */

import { useEffect, useState } from "react";
import { pending } from "@/lib/schedule";
import "./stage.css";

const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * Wait until nothing on the page has any drawing left to do.
 *
 * Plates paint themselves a slice of a frame at a time out of one shared
 * queue, so the frame after a cut is not the frame a plate finishes on. The
 * camera waits for the queue to run dry twice over before it fires.
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

export function useCamera(frames: number, fps: number, cues: unknown) {
  const [frame, setFrame] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const w = window as unknown as { __film?: unknown };
    let held = false;

    w.__film = {
      frames,
      fps,
      cues,
      /** Put frame `i` on the screen, and resolve once it is fully drawn. */
      seek: async (i: number) => {
        held = true;
        setFrame(i);
        return settle();
      },
    };

    // A visitor gets the film played to them; the camera takes it over.
    let live = true;
    let id = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (!live) return;
      if (!held) setFrame(Math.floor(((now - start) / 1000) * fps) % frames);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);

    return () => {
      live = false;
      cancelAnimationFrame(id);
      delete w.__film;
    };
  }, [frames, fps, cues]);

  return { frame, scale };
}
