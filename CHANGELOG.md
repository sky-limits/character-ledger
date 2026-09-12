# Character Ledger changelog

## v1.01 — Collection polish

- Added distinct system accents across character, progress, journal, art, and
  species cards so Aedraco, Kuda Pariso, and future systems scan differently.
- Added optional artwork `focalPoint` support so cover crops can keep faces and
  important pose details in frame.
- Reworked rank meters into lifetime rank tracks with threshold ticks for every
  configured milestone.
- Replaced placeholder Unicode sidebar glyphs with lightweight inline SVG icons
  and strengthened card hover/focus feedback.
- Added a global ledger search across characters, artwork titles and notes,
  rewards, species/ranks, and Forge recipes.
- Added multi-select species, progress/redemption, and current-rank filters plus
  total-points ascending and descending sorts.
- Added previous/next buttons and left/right arrow-key navigation to the artwork
  lightbox.
- Added visual Forge item tokens, with optional per-requirement `icon` artwork
  when a custom item image is available.
- Kept the v1.00 renderer and schema logic intact beneath a progressive
  enhancement layer, with new helper tests and CI coverage.

## v1.00 — Stable release

- Declared GP and KudaPoints as cumulative lifetime progress; rewards and
  crafting never spend rank points.
- Added contextual validation errors for species, characters, artwork,
  adjustments, rewards, and scoring presets.
- Expanded Field Journal data health with a validated schema summary and
  runtime image-failure reporting.
- Added a graceful image fallback and a recovery screen that links directly to
  the owner guide.
- Added high-contrast and forced-color support, clearer live calculator output,
  and final responsive polish.
- Added a stable-release preflight and GitHub Actions CI for every push and pull
  request.
- Froze and documented schema version 1. Existing v0.09 data remains compatible.

## v0.09 — The Field Journal

- Added character goals, forecasts, rank milestones, point histories, pending
  review, health warnings, scoring presets, and the artwork record generator.

## v0.08 — The Forge

- Added recipe priorities, material reservation, planned quantities, crafting,
  consumption history, and undo.

## v0.07–v0.07.2 — The Workshop

- Added shared browser-local inventory, import/export, validation, and tab sync.

## v0.04–v0.05.1

- Added independent art and roll statuses, item rewards, character art filters,
  and the first dedicated crafting page.
