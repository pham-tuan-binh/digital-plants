import type { NextConfig } from "next";

/**
 * The site is a book: every page of it is known at build time, so it is
 * exported as plain files and served from GitHub Pages with no server at all.
 *
 * A project page lives under /<repo>, so the prefix is passed in by the
 * workflow rather than hard-coded here. Locally it is empty and the site runs
 * from the root as usual.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Pages serves /a/ from /a/index.html, so ask for that shape.
  trailingSlash: true,
  images: { unoptimized: true },
  // The page is a sheet of paper; nothing should float on top of it.
  devIndicators: false,
};

export default nextConfig;
