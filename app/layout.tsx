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

export const metadata: Metadata = {
  title: "Digital Plant",
  description:
    "Lindenmayer systems, drawn. Rewrite a string of symbols, hand it to a turtle, and a plant appears.",
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
