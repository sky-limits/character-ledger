# Character Ledger

Finch's stable character, artwork, progression, reward, and crafting tracker.
The Field Journal provides point breakdowns and timelines, rank goals, milestone
forecasts, pending review, data-health checks, and an artwork scoring calculator.
Published records remain read-only; the browser-local Forge supports shared
inventory, priority planning, craft consumption, undoable history, and portable
workshop backups.
The site is plain HTML, CSS, and JavaScript with no build step or database.

## Deploy on Vercel

Import `sky-limits/character-ledger` into Vercel and select the **Other**
framework preset. Leave the build command empty and use `.` as the output
directory only if Vercel asks for one; otherwise keep its default. `index.html`
is the site entry point.

Once Git deployment is connected, every push to `main` produces a production
deployment. Other branches and pull requests can be used for previews.

## Update the tracker

Edit `data.js` to add or change characters, artwork, ranks, rewards, the shared
inventory defaults, and crafting plans. Add local artwork files beneath `images/`. Full record examples
and data rules are documented in `README.txt`.

Before committing, check the JavaScript files:

```bash
node --check data.js
node --check core.js
node --check app.js
node tests/core.test.js
node tests/app.test.js
node tests/journal.test.js
node tests/release.test.js
```

When changing `data.js`, `core.js`, `app.js`, or `style.css`, also increment
the matching `?v=` values in `index.html` so visitors receive the new files.

See [OWNER-GUIDE.md](OWNER-GUIDE.md) for the stable schema and publishing flow,
and [CHANGELOG.md](CHANGELOG.md) for release history. GitHub Actions runs the
same checks automatically on pushes and pull requests.
