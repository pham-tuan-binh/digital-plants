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

The text quotes *The Algorithmic Beauty of Plants* by Przemysław
Prusinkiewicz and Aristid Lindenmayer, which is [free to
read](https://algorithmicbotany.org/papers/abop/abop.pdf).

The stroke rendering owes its approach to
[bolechen/doodles-faces](https://github.com/bolechen/doodles-faces) and
[kengocodes/cyber-crowd](https://github.com/kengocodes/cyber-crowd), both MIT.
