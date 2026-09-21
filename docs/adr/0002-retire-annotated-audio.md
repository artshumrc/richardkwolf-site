# Retiring annotated audio while preserving its dataset out of band

## Context

The WordPress site carried a bespoke annotated-audio feature with interactive
players, its own post type, taxonomies, and author archives. Its players had
already been dead in production for years: the audio lived on SoundCloud
behind a legacy credential that now returns 401, so nothing playable reached
readers.

## Decision

The annotated-audio feature is not ported. No player, post type, taxonomy, or
archive route carries across to the static site.

Its scholarly dataset is preserved out of band instead: 21 tracks, 13 works,
and 121 time-aligned annotations carrying parallel idealTypical, asSung, and
translation columns were exported to the WebVTT utility's repository, with
the 21 leaked write credentials redacted.

## Rejected alternative

Port the players as static transcripts or rebuild the interactive player on
the new stack.

Static transcripts would preserve the reading experience without the audio,
which the 401 makes unrecoverable here, while a rebuilt player would restore
an interaction whose source material is unreachable. Both keep a post type,
taxonomies, and archive routes alive for a feature with no playable audio,
in exchange for porting and maintenance cost on a retired interaction.

## Consequences

- The post type, every taxonomy, the author archives, and all pagination are
  lost with the feature.
- Those URLs do not 404. Each is answered by a Legacy route pointing at its
  closest surviving topic.
- Recovering the SoundCloud masters and rendering the annotations as static
  transcripts remain possible as a later phase, from the preserved dataset.
