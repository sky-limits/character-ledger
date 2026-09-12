# Character Ledger owner guide

Character Ledger is a read-only static site. Visitors can browse the published
records and keep their own local Forge inventory, but only a GitHub commit can
change characters, points, artwork, ranks, rewards, or public recipe defaults.

## Publish an update

1. Edit `data.js` in the repository.
2. Add new local artwork files beneath `images/`.
3. Commit the changes to a branch or directly to `main`.
4. Wait for **Character Ledger CI** and **Vercel** to pass.
5. Open the live site and confirm the changed record.

The automated release check catches JavaScript errors, invalid records, missing
local images, stale cache versions, and regressions in the Field Journal and
Forge. A failed check should be fixed before merging.

## Stable data contract

The root object remains `format: 'character-ledger', version: 1`. Schema version
1 contains these top-level sections:

- `systems`: species, cumulative point units, and rank thresholds
- `characters`: identity, starting points, cover, tags, notes, and optional goal
- `art`: image, score, approval and roll states, rewards, credit, links, and notes
- `adjustments`: dated manual bonuses or corrections
- `rewards` and `redemptions`: manual and rank reward records
- `scoringPresets`: reusable Field Journal calculator rules
- `inventory`: published Forge starting amounts
- `crafting`: recipes and their requirements

New optional fields may be added in future 1.x versions. Existing fields will
not be removed or reinterpreted without a documented migration.

## Point rules

Every system must use `pointMode: 'cumulative'`. Artwork with
`status: 'approved'`, the character's `openingXP`, and all manual adjustments
form the current rank total. Pending and rejected art remain visible but do not
count. Redeeming rewards and crafting items never subtract GP or KudaPoints.

If a species has spendable currency, track it separately in inventory. Do not
reuse the cumulative rank total as a wallet.

## Character goals

Leave `goalRankId: ''` and `goalXP: 0` to target the next rank automatically.
Set `goalRankId` to a valid rank ID to aim farther ahead. A positive `goalXP`
takes priority and creates a custom numeric goal.

## Scoring new artwork

Open **Field journal → Artwork scoring calculator**. Choose the character,
preset, quantities, manual points, and multiplier. Copy the generated object,
paste it inside the `art` array in `data.js`, review every field, and add the
image file before committing. Kuda Pariso currently uses manual points until an
owner-approved scoring preset is added.

## If the site refuses to load

The recovery screen identifies the record type and ID where validation stopped.
Correct that record in `data.js` and reload. Typical causes are a duplicate ID,
an invalid character or rank reference, malformed URL, unsupported status, or a
missing comma that prevents JavaScript from loading at all.

For a syntax error with no record name, inspect the most recently edited lines
and run:

```bash
node --check data.js
node tests/release.test.js
```

## Forge storage

Inventory, priorities, planned quantities, current goal, and crafting history
are saved only in that browser. Export a workshop backup before clearing site
data or changing devices. Published `inventory` values remain the reset defaults.
