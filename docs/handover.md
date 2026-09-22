# Handover

Where this repository stands at the end of the rebuild, what the WordPress
droplet still holds that this site does not, and what a deploy needs.

The site is content-complete and builds from a clean checkout. It has never
been deployed: the GitHub account that will own it is undecided, so
`siteConfig.repo` in `src/lib/site.ts` carries a flagged placeholder.

## What the droplet still holds

The WordPress droplet stays running and untouched, by decision. It is the only
remaining copy of the following.

**21 SoundCloud track ids whose audio was never recovered.** The annotated-audio
feature is retired (see `adr/0002-retire-annotated-audio.md`). Its scholarly
dataset — 21 tracks, 13 works, 121 time-aligned annotations — was exported to
the WebVTT utility's repository with its leaked write credentials redacted, but
the audio itself lived on SoundCloud behind a legacy client credential that now
returns 401. The ids survive in the exported dataset; the recordings do not.

**The `critiqueitAudio` MySQL tables.** The feature's own storage: tracks,
works and annotations, plus a write-and-delete credential per track. Nothing in
this site reads them.

**An anonymous write surface.** The annotated-audio REST API hands any
unauthenticated caller a distinct write-and-delete credential for each of its 21
tracks. Because the droplet stays up, this remains live. It is outside this
rebuild's scope and should not be forgotten.

**Roughly 147 orphaned media attachments.** The image port fetched only what the
rendered pages actually reference, over HTTP, at the largest referenced variant.
Attachments no page links to were left behind, along with the theme's derivative
crops.

**A 1.5 GB uploads directory.** What came across is 255 photographs and 59
Vimeo poster frames — 314 content-addressed images, held with their responsive
renditions as one tree under `static/uploads/`, 195 MB in 2146 files (see
`adr/0001-single-content-addressed-media-tree.md`). The 522 image URLs the
rendered pages reference are not 522 photographs: half of them are the theme's
`-uai` crops of pictures the port already fetched at full size, and are aliased
to them rather than ported. The rest stays on the droplet.

**The one-time migration inputs** — the preserved source pages, sitemaps, image
and PDF source maps and Vimeo poster map — were removed from the working tree in
the commit that closed the rebuild. They are in git history, and
`scripts/extract-pages.mjs`, `scripts/port-images.mjs` and
`scripts/port-pdfs.mjs` need them restored from there to re-run. The Legacy
route map they sat beside is build input, not migration input, and now lives at
`scripts/legacy-routes.json`.

## What the deploy epic must do

In roughly this order.

1. **Choose the owning account** — Richard's personal account or the
   `artshumrc` org. This decides everything below it, and it decides how bad
   the `*.github.io` Allowlist entry is: acceptable under a personal account,
   materially worse under an org, because allowlisting that shared origin
   grants the editor origin for every project page on the account.
2. **Create the repository and push `main`**, then enable Pages with the
   GitHub Actions source. A push to `main` builds and deploys.
3. **Install the Uncial GitHub App** on the repository, so the canonical auth
   broker can mint a token for it.
4. **Replace the `siteConfig.repo` placeholder** in `src/lib/site.ts` with
   `<owner>/<repo>`. It is flagged there as an open decision.
5. **Put the real origin in the Allowlist** — `.uncial/cms.json`, the committed
   document naming the origins permitted to broker a token for this repo. It
   currently holds `https://TODO-OWNER.github.io` and `http://localhost:5173`.
   The first deploy serves at the Pages project URL, so that shared
   `*.github.io` origin goes in.
6. **Run Uncial's `doctor`** against the deployed site to check the App
   install, the Allowlist and the broker agree.
7. **Cut over the custom domain** when review is done: DNS, the Pages custom
   domain, then **remove the `*.github.io` origin from the Allowlist**. Base
   path and site origin both come from CI environment variables, so the same
   build serves a project URL under `/<repo>` and a custom domain at `/`.

## What is unverified here

The GitHub Forge path has never run. Sign-in, the save-to-commit round trip,
the commit-status poll and the 409 conflict banner are all unexercised: the
editing that was verified ran against the local Forge in the dev server, which
writes files into the checkout with no authentication. The deploy epic owns
stories 19, 20, 33, 34, 40, 41 and 46.

Story 37 — making the droplet decommissionable — stays deferred. A site that
has never been deployed does not make the droplet retirable.
