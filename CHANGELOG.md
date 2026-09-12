# Character Ledger changelog

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
