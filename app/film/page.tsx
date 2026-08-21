import type { Metadata } from "next";
import Film from "./Film";

export const metadata: Metadata = {
  title: "Digital Plant — the film",
  description:
    "Thirty seconds of L-systems: the word on one side, the plant it draws on the other.",
};

/**
 * The film, playing.
 *
 * The same page the camera photographs a frame at a time to make the video —
 * see `scripts/render-film.mjs`. Left to itself it just plays.
 */
export default function FilmPage() {
  return <Film />;
}
