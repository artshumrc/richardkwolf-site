# A single content-addressed media tree

## Context

The site carries about 522 ported images alongside whatever the Content Owner
uploads after launch. Both sets need responsive renditions, stable addresses
that survive rebuilds, and an upload path that never collides or overwrites.

## Decision

Ported images and Content Owner uploads share one media tree and one naming
scheme: each file is named by a truncated hash of its bytes.

Every upload is therefore idempotent. Committing the same bytes twice reuses
the same file, and distinct bytes can never collide under the same name.

## Rejected alternative

Two trees: keep readable, hand-chosen filenames for the ported images and
content-address only new uploads.

That would preserve meaningful filenames for the ported set, but it keeps two
naming rules, two lookup paths, and two upload behaviours alive indefinitely
for the sake of readability that readers never see.

## Consequences

- One code path serves and uploads every image, and repeated uploads of the
  same file are free.
- Meaningful filenames are lost. Debugging an image means tracing its hash
  back through the port or the Image manifest rather than reading its name.
- The Image manifest lives outside the Content directory, in `generated/`. It
  is generated data, not a Content document, and an Editor variant that rewrote
  it as one would break every responsive image on the site. A predicate is not
  enough: `uncial-cms`'s Index page enumerates the Content directory itself and
  takes no filter, so a manifest kept there would be offered for editing and
  deletion whatever this site excluded.
