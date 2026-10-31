# kb — the support knowledge base

**kb** = knowledge base. What the support desk knows about how our products break, written
down where the code can keep it honest.

One desk takes reports for every product we run: `sched-prod` (calendar invites for about
300k people) and the rest. When something
goes wrong, the reports reach the desk first. This kb is how the desk triages them, what each
incident turned out to be, and why we decided what we decided.

## What's here

```
src/routes/kb/      the pages (.svx: Markdown with components)
  triage/           how the desk handles incoming reports
  incidents/        one page per big ticket
  decisions/        numbered decision records
src/lib/kb/         components and the logic they run
src/lib/layouts/    the frame every page shares
src/lib/data/       exports from the ticket system
```

## Conventions

- Words in the page, logic in `src/lib` (imported as `#lib/…`). A number that can be computed belongs in a component.
- Every page starts with frontmatter: `title`, `owner`, `status`, `reviewed`.
- A decision is never edited after it is accepted. A new record replaces it.
- A page you add is signed: its frontmatter carries your `signature` and it ends with `<RenderStamp {signature} />`, so the desk knows who wrote it.

## Owners

Support desk. Decision records: whoever signed them.

---

Exported 2026-10-04 from the `support` repo, `apps/kb/` → `src/`.

## S01E03 investigation

This repository contains the course-provided export and a signed replacement
decision for incident #4471. The accepted decision 0001 is unchanged.

- New page source: `src/routes/kb/decisions/0002-dedupe-by-cause/+page.svx`.
- Actual rendered page: `rendered/kb/decisions/0002-dedupe-by-cause/index.html`.
- Parser ticket: <https://github.com/evilbc/mega-s01e03-what-it-shows/issues/2>.
- Form-hint ticket: <https://github.com/evilbc/mega-s01e03-what-it-shows/issues/1>.
- Reproducible ticket bodies and report memberships: `issues/parser.md` and `issues/hint.md`.

The rendered directory is the SvelteKit static build, including computed tables,
the queue chart, the signature-derived desk reference, and client code for the
interactive deduplication examples. It is not a Markdown-only preview.

Requires Node.js 24 or newer. From this directory:

```powershell
npm ci
npm test
npm run check
npm run build
npm run preview
```

Open the preview's local URL and follow the knowledge-base link. Regenerate ticket
bodies with `npm run prepare-issues`. The page computes counts from report IDs and
tenant settings, not from intake tags. Its timing-anomaly section records the
limits of that classification rather than inventing a root cause.
