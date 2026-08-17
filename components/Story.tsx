"use client";

import { useEffect, useRef } from "react";

/**
 * A continuous page, with a lot of air between sections.
 *
 * Each section is held back until it comes into view, then it arrives: the
 * plate draws itself and the setting rises under it. A section is observed
 * only once, so scrolling back up finds the page as you left it rather than
 * replaying itself at you.
 */
export default function Story({ children }: { children: React.ReactNode }) {
  const deck = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = deck.current;
    if (!root) return;

    // Marks that the script is running, so a reader without it still gets the
    // whole page rather than a blank one.
    root.classList.add("is-live");

    const sections = Array.from(root.querySelectorAll<HTMLElement>(".scene"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-active");
          io.unobserve(e.target);
        }
      },
      // Threshold has to stay at zero. A fraction of the element is no use
      // here: the flora section is some twelve thousand pixels tall, so any
      // percentage of it is taller than the viewport, the callback could
      // never fire, and the whole section stayed invisible.
      { rootMargin: "0px 0px -12% 0px", threshold: 0 },
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <div className="deck" ref={deck}>
      {children}
    </div>
  );
}
