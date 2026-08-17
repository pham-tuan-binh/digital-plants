import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import "./globals.css";

// One face for everything — prose, titles, and the notation alike.
const garamond = EB_Garamond({
  // Vietnamese as well as latin: half the plants in the book are named in it,
  // and without the subset every diacritic drops to a fallback face.
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-body",
});

/* Cards need an absolute address for the image, and the site's own address is
   not known until it is deployed, so the workflow passes it in. This is the
   origin alone: Next puts the base path on the front of the image itself, and
   giving it here as well addresses the card twice. */
const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000";
const site = origin + (process.env.NEXT_PUBLIC_BASE_PATH ?? "");

const description =
  "Lindenmayer systems, drawn. Rewrite a string of symbols, hand it to a turtle, and a plant appears.";

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: "Digital Plant",
  description,
  // The icon and the card are both taken from the book itself: the branch
  // from Fig. 4, and the landing page whole. See app/icon.png and
  // app/opengraph-image.png, which Next finds by name.
  openGraph: {
    title: "Digital Plant",
    description,
    type: "article",
    url: site,
  },
  twitter: { card: "summary_large_image", title: "Digital Plant", description },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={garamond.variable}>{children}</body>
    </html>
  );
}
