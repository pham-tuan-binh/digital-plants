import type { Metadata } from "next";
import Gallery from "./Gallery";

export const metadata: Metadata = {
  title: "Digital Plant — the gallery",
  description: "Fifteen Vietnamese flora, drawn from their own rules, all at once.",
};

/**
 * The gallery, playing.
 *
 * The same page the camera photographs a frame at a time to make the second
 * video — see `scripts/render-film.mjs`. Left to itself it just plays.
 */
export default function GalleryPage() {
  return <Gallery />;
}
