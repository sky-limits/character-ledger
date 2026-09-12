CHARACTER LEDGER v0.08 — THE FORGE

WHAT CHANGED
- Recipes form a priority queue. Higher recipes reserve shared materials before
  lower recipes, so one stack of items no longer makes every plan look ready.
- Pinning a current goal moves it to the top; arrow buttons adjust the rest of
  the order.
- Planned quantity multiplies every requirement and the combined gathering
  list.
- Ready plans can be crafted after a consumption summary and confirmation.
- Crafting subtracts the exact materials and creates a dated history record.
- Undo restores those exact materials and marks the record as undone.
- Recipe cards show Ready to forge, Gathering items, or Reserved above.
- Backups now include inventory, priority, quantities, current goal, and
  crafting history. v0.07 inventory-only exports still import safely.
- Optional category, notes, and reference fields are supported on recipes.
- A small completion sparkle respects reduced-motion preferences.

PRIORITY AND CRAFTING
The first recipe reserves what it needs, even while it is still gathering.
Every lower recipe is calculated from what remains. “Reserved above” means the
raw inventory could make that recipe, but an earlier plan is using those items.
Move the recipe earlier if it should win the conflict.

Crafting always uses the current planned quantity. The confirmation lists every
material that will be consumed. Undo is local to this browser and can be used
once per history record. It will stop safely rather than push any restored item
over the maximum supported inventory amount.

RECIPE DETAILS
Optional fields can be added before requirements:
  {
    id: 'healing-potion',
    name: 'Healing potion',
    category: 'Potions',
    notes: 'Keep one ready for expeditions.',
    reference: 'https://example.com/recipe',
    requirements: [
      {item: 'Bilberries', required: 5},
      {item: 'Thread', required: 1}
    ]
  }

reference must be blank or begin with https:// or http://. Category and notes
can be blank. Priority, planned quantity, goal, and history are browser-local;
they do not belong in data.js.

CHARACTER LEDGER v0.07.2 — PREVIOUS UPDATE NOTES

WHAT CHANGED
- Exported inventory JSON files can now be imported with Merge or Replace.
- Imports are validated before anything is saved; malformed, oversized, and
  unsupported files show an error inside the import window.
- Each material shows which recipes need it and how many are still missing.
- “Only show missing” hides stocked and currently unused inventory items.
- Inventory changes sync across other open tabs for this site.
- The inventory header shows when the browser copy was last saved.
- Plus/minus controls keep keyboard focus after progress recalculates.
- Suspiciously large quantities require confirmation, and invalid number input
  is rejected with a readable message.

IMPORTING INVENTORY
On the Crafting page, choose Import inventory and select a JSON file previously
created with Export inventory. Merge updates only the items in the file.
Replace discards the browser copy first, then adds the imported items; anything
required by a recipe but absent from the file begins at 0. Neither option edits
data.js or changes the inventory on another device.

CHARACTER LEDGER v0.07 — PREVIOUS UPDATE NOTES

WHAT CHANGED
- Crafting now uses one shared inventory instead of a separate have amount in
  every recipe.
- Inventory has accessible plus/minus controls and number fields on the site.
- Inventory changes save in this browser with localStorage and never change the
  public data.js file.
- The gathering list combines missing materials across every valid recipe.
- Inventory can be exported as a JSON backup or reset to the data.js defaults.
- A malformed crafting recipe or inventory entry is skipped with a visible
  warning on the Crafting page instead of breaking the entire ledger.

SHARED INVENTORY
Set the public defaults once in data.js:
  inventory: {
    Stick: 1,
    Thread: 1,
    Arrowhead: 0
  },

Recipes only say what they require:
  {
    id: 'healing-potion',
    name: 'Healing potion',
    requirements: [
      {item: 'Bilberries', required: 5},
      {item: 'Thread', required: 1}
    ]
  }

Item names are case-sensitive and should match the inventory keys exactly.
If a recipe uses a valid item that is missing from inventory, it starts at 0.
Old recipes containing have still load for compatibility, but new recipes
should keep owned amounts in inventory only.

CHARACTER LEDGER v0.05.1 — PREVIOUS UPDATE NOTES

VERCEL DEPLOYMENT
This folder is now the source for the sky-limits/character-ledger repository.
Connect that repository to a Vercel project using the Other framework preset.
There is no build command and the output directory is the repository root.
After the first setup, pushes to main publish updates automatically.

To update the live tracker, edit data.js and any relevant images, commit the
changes, and push them to main. Do not upload a ZIP to Vercel for routine edits.

BUG FIX
The recipe template now lives safely inside the one real crafting array.
Remove only the /* and */ surrounding the example recipe. Do not uncomment or
add another "crafting: [" line. This prevents the syntax error that previously
stopped every page from loading.

A separate Crafting page tracks recipes, required items, items already owned,
and overall progress. Add or update recipes in the crafting array in data.js;
progress recalculates automatically. Recipes that are ready to make appear
after in-progress recipes.

CRAFTING PLANS
Add this inside the existing crafting array in data.js:
  {
    id: 'healing-potion',
    name: 'Healing potion',
    requirements: [
      {item: 'Bilberries', required: 5},
      {item: 'Thread', required: 1}
    ]
  }

Each recipe ID must be unique. required must be greater than zero. The progress
bar counts shared inventory items up to the amount required,
so extra inventory will not push progress past 100%. A requirement is complete
when the shared inventory amount is equal to or greater than required. Leave
the example recipe commented out if you do not have any plans to show yet.

CHARACTER LEDGER v0.04 — PREVIOUS UPDATE NOTES

The circled collection introduction, stats and top bar are removed.
The standalone Art ledger is removed. Open a character to see their Art
section, with search, XP, roll and item-reward filters.

ART STATUS AND ITEM REWARDS
Edit these fields on each artwork in data.js:
  status: 'approved',       // Counted; pending/rejected do not add XP
  rolled: true,            // Independent of counted status
  itemRewards: '2 herbs, 1 iron ore',
  rewardsRedeemed: true,
  redemptionLink: 'https://example.com/your-claim',

Use rolled: false before results arrive. Keep status: 'approved' if GP
already counts; never replace status with 'rolled'. Both badges can appear
at the same time. Changing rolled or redeeming items never changes XP.
Use itemRewards: '' if no items have been recorded. Set rewardsRedeemed
only after claiming those items; the boolean covers the whole listed bundle.
redemptionLink can be blank; if provided, use an https:// or http:// link.
Unredeemed items can have a claim link too. Art item rewards also appear on
the Rewards page automatically; do not duplicate them in the rewards array.
Existing art defaults to not rolled and no items recorded: no history guessed.
Credit, source, date and notes may now be omitted (they default to blank).

INSTALL v0.05.1
Keep index.html, app.js, core.js, style.css, data.js, and images/ together at
the repository root. The latest character records, artwork, species rules,
XP amounts, notes, credits, reward state, and crafting plans are retained.
Some artwork uses its original external image URL because its file is not in
the repository. All editing stays in code; the public site has no editing or
upload buttons.

COPY-PASTE ART RECORD (inside the art array)
  {
    id: 'nerissa-new-art', characterId: 'nerissa',
    title: 'Artwork title', image: 'images/your-art.jpg',
    xp: 7, status: 'approved', rolled: false,
    itemRewards: '', rewardsRedeemed: false, redemptionLink: '',
    credit: 'sky-limits', source: '', date: '', notes: ''
  }

CHARACTER LEDGER v0.05.1 — my personal art/XP tracker
=====================================================

Visitors can look but not touch. Everything — characters, art, XP, species
rules, rewards, and crafting plans — lives in data.js and gets edited by hand
in GitHub or in a text editor before committing. No accounts, no database, and
no public save button.

PUBLISHING AN UPDATE
1. Edit data.js and add any new artwork beneath images/.
2. Commit the changed files and push them to the main branch.
3. Vercel will create and publish the new deployment automatically once the
   Git integration is connected.
4. Hard-refresh if an old asset sticks around. Update the ?v= value in
   index.html whenever app.js, core.js, data.js, or style.css changes.

If I made changes locally in v0.01 that never got uploaded, back those up
before overwriting — this data.js doesn’t know about them, and updating
won’t reach into the old browser storage to pull anything in or wipe it.

HOW THE SITE ACTUALLY WORKS
I edit data.js — through GitHub or locally — and that’s
the whole publishing flow. No backend, no login screen, nothing else
touches the live files. A visitor can mess with their own browser’s copy
of the page using dev tools, same as on any static site, but it never
reaches what’s actually hosted. Don’t put account credentials in the code.

EDITING data.js
It’s one big object with eight parts:
  systems       — species and their leveling rules
  characters    — names, species, starting XP, references, tags, notes
  art           — artwork records and the XP they’re worth
  adjustments   — manual XP bonuses or corrections
  rewards       — one-off earned rewards
  redemptions   — claim dates/notes for rewards already redeemed
  inventory     — shared owned item amounts and public defaults
  crafting      — recipes and required item amounts

Keep "window.CHARACTER_LEDGER_SEED = {" and the closing "};" intact — don’t
replace the whole file with one of the examples below, just drop new
records into the right array, comma-separated. Use straight quotes, not
the curly ones a word processor likes to insert. Escape an apostrophe in
single-quoted text with a backslash, or just use double quotes instead.
IDs need to be unique within their list and can only use letters, numbers,
underscores, and hyphens.

ADD A CHARACTER
  {
    id: 'new-character',
    name: 'Character Name',
    systemId: 'aedraco',
    openingXP: 0,
    coverId: '',
    tags: ['Optional tag'],
    notes: ''
  }
systemId has to match a system’s id, or be '' if unassigned. coverId
points to an art record’s id (not a filename) — leave it blank until
there’s actual art. openingXP is the balance before any artwork in this
ledger gets counted. To delete a character, pull its art, adjustments,
rewards, and redemptions too, then remove the image files separately
from the dashboard.

ADD ARTWORK
Upload the image through the dashboard first, then add:
  {
    id: 'nerissa-new-art',
    characterId: 'nerissa',
    title: 'Artwork title',
    image: 'images/nerissa-new-art.jpg',
    xp: 10,
    status: 'pending',
    credit: 'Artist name',
    source: '',
    date: '2026-09-09',
    notes: ''
  }
status is 'approved' (counts toward XP), 'pending' (not counted yet), or
'rejected' (not counted — good for reference sheets I don’t want to count).
Dates can be blank. Source links need to start with https:// or http://,
or be blank. Set a character’s coverId to an art piece’s id to use it as
the main reference image.

UPDATING XP
Total = openingXP + approved artwork XP + adjustments. Say a character
opens at 32 GP — don’t also give that 32 GP to old artwork records, or
it’ll double count. New approved art worth 10 GP would bring them to 42.
Fix a starting balance by editing openingXP directly. For a one-off bonus
or correction, add:
  {
    id: 'nerissa-event-bonus', characterId: 'nerissa',
    amount: 5, reason: 'Event bonus', date: '2026-09-09'
  }
Negative adjustments are fine, the total just can’t go below zero. XP
supports two decimal places. Editing or deleting artwork recalculates
everything automatically.

ADD A SPECIES / LEVELING SYSTEM
  {
    id: 'example-species', name: 'Example Species',
    xpName: 'Renown', levelName: 'Tier', baseName: 'Newcomer',
    ranks: [
      {id: 'initiate', name: 'Initiate', threshold: 100, reward: ''},
      {id: 'master', name: 'Master', threshold: 500, reward: 'Master badge'}
    ]
  }
Those thresholds are made up — swap in the real ones. xpName can be GP,
XP, Points, Renown, whatever the species calls it; levelName is Rank,
Level, Tier, etc.; baseName labels the stretch before the first rank.
Ranks need unique, increasing thresholds (zero’s fine as a floor). Keep
existing rank IDs when just renaming or retuning them so claim history
still lines up.

Aedraco’s actual rules: Guardian at 250 total GP, Ancient at 750. “Below
Guardian” is just a placeholder label, not an official rank name.

The progress bar is relative to the current rank interval — at 500 GP,
that’s 50% of the way from Guardian (250) to Ancient (750). Sorting by
“closest to rank” compares those percentages across species instead of
mixing raw point totals, and the within-20% filter just means 80%+ of
that interval is done.

RECORD AN EARNED REWARD
  {
    id: 'nerissa-event-prize', characterId: 'nerissa',
    title: 'Event prize', notes: 'Claim instructions', artId: ''
  }
artId can point to art the same character owns, or stay blank. Manual
rewards here count as already earned. For anything unlocked by hitting a
rank threshold, put the reward description on that rank instead — it’ll
stay locked until the XP gets there.

MARK A REWARD REDEEMED
Manual reward — key is 'manual:' + the reward id:
  'manual:nerissa-event-prize': {
    date: '2026-09-09T12:00:00Z', note: 'Claimed; receipt or link here'
  }
Rank reward — key is 'rank:' + character id + ':' + rank id:
  'rank:nerissa:guardian': {
    date: '2026-09-09T12:00:00Z', note: 'Claimed on the species website'
  }
Only add this after actually claiming it. To undo, just delete the entry.
Claiming doesn’t touch XP or contact any other site — it’s purely a note
for me. If XP later drops below a claimed threshold, the record stays put.

BACKUPS
Back up data.js and images/ before editing anything. To restore, just
re-upload the backups — there’s no import tool, copy/paste is it. A
broken record shows a loading error instead of wrong totals, so check for
missing commas, quotes, or brackets first if something looks off.

A NOTE ON THE TECH
Plain HTML/CSS/JS, hash-based routing, no build step or backend. Search
and filter settings live in memory and reset on navigation or reload.
Keep images a reasonable size for mobile, and credit artists properly.
Anything uploaded here is public, same as any other Neocities page.

Artwork and character designs belong to their original owners. This is
just my personal ledger, not an official species tool or a Toyhou.se
replacement.
