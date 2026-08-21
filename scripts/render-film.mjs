#!/usr/bin/env node
/**
 * Photograph the film.
 *
 * `/film` draws whatever frame it is asked for and says when it has finished
 * drawing it, so this walks the frames one at a time, takes a picture of each,
 * and pipes them straight into ffmpeg. Nothing is timed: a slow machine takes
 * longer to make the film, not a slower film.
 *
 *   npm run build && npx serve out          # or: npm run dev
 *   node scripts/render-film.mjs --url http://localhost:3000/film/
 *
 * Needs Playwright and an ffmpeg with libx264 on the path. Both are found
 * automatically if they are installed anywhere node can resolve them:
 *
 *   npm i -D playwright ffmpeg-static && npx playwright install chromium
 */

import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
}

const url = args.get("url") ?? "http://localhost:3000/film/";
const out = resolve(args.get("out") ?? "film/digital-plant.mp4");
const width = Number(args.get("width") ?? 1920);
const height = Number(args.get("height") ?? 1080);
/**
 * How many device pixels to a CSS pixel while photographing.
 *
 * A plate caps its own backing store at 1.5, so shooting at exactly that and
 * scaling back down gives text a supersampled edge without ever asking the
 * drawing for pixels it will not draw.
 */
const density = Number(args.get("density") ?? 1.5);

function findModule(name, extra = []) {
  const roots = [
    ...extra,
    name,
    `${process.env.npm_config_prefix ?? "/usr/local"}/lib/node_modules/${name}`,
  ];
  for (const candidate of roots) {
    try {
      return require(candidate);
    } catch {
      /* keep looking */
    }
  }
  throw new Error(`cannot find ${name} — npm i -D ${name}`);
}

const { chromium } = findModule("playwright", ["playwright-core"]);

let ffmpeg = args.get("ffmpeg") ?? process.env.FFMPEG ?? null;
if (!ffmpeg) {
  try {
    ffmpeg = require("ffmpeg-static");
  } catch {
    ffmpeg = "ffmpeg";
  }
}

mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch({
  args: ["--force-color-profile=srgb", "--font-render-hinting=none"],
});
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: density,
});
page.on("pageerror", (e) => console.error("page:", e.message));

await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => Boolean(window.__film), null, {
  timeout: 60_000,
});

const { frames, fps } = await page.evaluate(() => ({
  frames: window.__film.frames,
  fps: window.__film.fps,
}));
console.log(`${frames} frames at ${fps}fps — ${(frames / fps).toFixed(1)}s`);

const encoder = spawn(
  ffmpeg,
  [
    "-y",
    "-f", "image2pipe",
    "-framerate", String(fps),
    "-c:v", "png",
    "-i", "-",
    "-vf", `scale=${width}:${height}:flags=lanczos`,
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    out,
  ],
  { stdio: ["pipe", "inherit", "inherit"] },
);

const done = new Promise((ok, no) => {
  encoder.on("error", no);
  encoder.on("close", (code) =>
    code === 0 ? ok() : no(new Error(`ffmpeg exited ${code}`)),
  );
});

const write = (buf) =>
  new Promise((ok) => {
    if (encoder.stdin.write(buf)) ok();
    else encoder.stdin.once("drain", ok);
  });

const clip = { x: 0, y: 0, width, height };
const started = Date.now();
for (let i = 0; i < frames; i++) {
  await page.evaluate((n) => window.__film.seek(n), i);
  await write(await page.screenshot({ type: "png", clip }));
  if ((i + 1) % 30 === 0 || i + 1 === frames) {
    const per = (Date.now() - started) / (i + 1);
    const left = ((frames - i - 1) * per) / 1000;
    process.stdout.write(
      `\r  ${i + 1}/${frames}  ${left.toFixed(0)}s left   `,
    );
  }
}
process.stdout.write("\n");

encoder.stdin.end();
await done;
await browser.close();
console.log(`wrote ${out}`);
