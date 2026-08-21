# Digital Plant

An illustrated book about Lindenmayer systems: rewrite a string of symbols,
hand it to a turtle, and a plant appears. It ends in a Vietnamese garden and a
pair of Tết trees.

Every figure is drawn on a canvas at read time, in graphite and watercolour
wash, from the rules printed underneath it.

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. Node 20 or newer.

## Build it

```bash
npm run build
```

The site is fully static, so this writes plain files to `out/` with no server
behind them. To preview that build the way GitHub Pages serves it:

```bash
npx serve out
```

## The film

`film/digital-plant.mp4` is a reel of the same figures, a little over two
minutes of it. The opening plate of the book draws itself, and then every one
of the fifteen species is taken in turn: the name, the productions read onto
the page a line at a time, the word it starts from and the plant that word
draws, and then pass after pass until it flowers. The word is on one side
throughout and the plant it draws is on the other. On each pass the letters a
production is about to replace are washed in graphite, and what it writes in
their place is washed in that plant's own flower.

A long derivation takes each pass more quickly than a short one, so a grass
that needs eighteen rewrites to put out a head does not run three times the
length of a tree that is done in six.

Every rewrite also sounds — a short droplet whose pitch climbs while it rings,
walking up a pentatone as the derivation deepens, so a plant is heard growing
rather than ticking. The track is arithmetic over a sample buffer in
`scripts/film-sound.mjs`; there are no recordings and no audio library.

It is not a screen recording. `/film` is a page like any other on the site —
same face, same paper, same canvases — that draws whatever frame it is asked
for and says when it has finished drawing it. The camera walks the frames one
at a time, so nothing is ever photographed half-drawn and two runs come out
identical:

```bash
npm run build && npx serve out          # or npm run dev
node scripts/render-film.mjs --url http://localhost:3000/film/
```

That needs Playwright and an ffmpeg with libx264, neither of which the site
itself wants:

```bash
npm i -D playwright ffmpeg-static && npx playwright install chromium
```

`film/digital-flora.mp4` is a second, shorter one: the whole flora on a single
sheet, five across and three down, all fifteen drawing themselves at once and
each named as it finishes. How long a plant takes is mostly how much of it
there is, so a tuft of grass is over almost before it starts while an apricot
is still filling in after everything around it has stopped — which is the
truer thing to watch anyway. It comes off `/gallery` by the same camera:

```bash
node scripts/render-film.mjs --url http://localhost:3000/gallery/ \
  --out film/digital-flora.mp4
```

Visiting `/film` or `/gallery` in a browser just plays them.

## Deploy it

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/pages.yml`. Enable it once under **Settings → Pages →
Build and deployment → Source → GitHub Actions**.

The workflow works out the URL prefix from the repository name on its own, so
there is nothing to configure: a repo named `digital-plants` is served from
`/digital-plants`, and a `<user>.github.io` repo is served from the root.

## Where things are

| Path | What it holds |
| --- | --- |
| `lib/lsystem.ts` | The engine. `derive` rewrites and knows no geometry; `interpret` turns a word into strokes and knows no rewriting. |
| `lib/ink.ts` | The drawing. Pencil ribbons, watercolour dabs, paper grain. |
| `lib/schedule.ts` | One frame budget shared by every figure, so painting never blocks the scroll. |
| `lib/flora.ts` | The plants, each with its axiom, rules, and turtle settings. |
| `app/page.tsx` | The book, chapter by chapter. |
| `app/film/` | The reel: the score, the derivation with its replacements marked, the stage, and the camera both films are photographed through. |
| `app/gallery/` | The second reel: every species on one sheet, growing at once. |
| `scripts/` | The camera that walks the film frame by frame, and the synthesiser that gives every rewrite a sound. |

The text quotes *The Algorithmic Beauty of Plants* by Przemysław
Prusinkiewicz and Aristid Lindenmayer, which is [free to
read](https://algorithmicbotany.org/papers/abop/abop.pdf).

The stroke rendering owes its approach to
[bolechen/doodles-faces](https://github.com/bolechen/doodles-faces) and
[kengocodes/cyber-crowd](https://github.com/kengocodes/cyber-crowd), both MIT.
