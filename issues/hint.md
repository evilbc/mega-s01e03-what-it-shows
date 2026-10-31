## Scope and report count

**33 unique reports** merged into original support ticket **#4471** belong to `hint` under the KB's tenant-aware classification. 3 tenants. First received 2026-04-17; last received 2026-09-22.

Deduplicate the overlapping export by report ID before filtering `mergedInto === 4471`. The full export has 427 rows and 412 unique reports. Do not use intake tags as causes. This group's intake tags are parser: 15, hint: 18.

The booking-v3 date field prints `MM/DD/YYYY` for day-first tenants. People who follow that hint enter month first, but the form reads the tenant's day-first convention. This is distinct from the shared parser reading month first.

## Reproduction and expected behavior

Use Alder Physio (`de-DE`, booking-v3), Copper Studio (`es-ES`, booking-v3), or Pale Harbour (`pt-PT`, booking-v3) through the `form` channel. The hint says `MM/DD/YYYY`. To book 7 April, follow it and enter `04/07/2026`. The day-first form instead reads 4 July.

The hint must agree with the date convention the form actually accepts. Fix and test the hint and parsing together for every supported tenant convention. Fixing only the shared parser does not resolve misleading form instructions.

## Evidence

- `R-41230`, Copper Studio, form, is tagged `parser` by intake but belongs to `hint` by tenant locale and form version.
- `R-41241`, Alder Physio, form, reports June/August reversal.
- `R-41251`, Pale Harbour, form, reports January/July reversal and is also mis-tagged `parser`.
- Non-form reports at these same tenants belong to the shared parser group under the exported rule. Do not count every report at a booking-v3 tenant here.

## Acceptance criteria

The displayed date hint and actual form parser agree for day-first and month-first tenants. Following the hint preserves the selected date. Cover all three affected booking-v3 tenants and retain correct booking-v2 behavior. Keep the shared parser fix tracked separately.

## Reproducible sources

See `src/lib/data/reports-4471.json`, `src/lib/data/tenants/*.json`, `src/lib/kb/causes.ts`, and `src/lib/kb/locales.ts`. Recompute with `npm run prepare-issues`. This is an analysis of the supplied export, not a claim that production was changed.

The signed KB source is `src/routes/kb/decisions/0002-dedupe-by-cause/+page.svx`. Its actual prerendered page is `rendered/kb/decisions/0002-dedupe-by-cause/index.html`.

## Report IDs

`R-41230`, `R-41241`, `R-41251`, `R-41259`, `R-41262`, `R-41275`, `R-41294`, `R-41305`, `R-41308`, `R-41366`, `R-41372`, `R-41384`, `R-41387`, `R-41396`, `R-41400`, `R-41406`, `R-41415`, `R-41416`, `R-41418`, `R-41428`, `R-41439`, `R-41441`, `R-41449`, `R-41453`, `R-41456`, `R-41460`, `R-41472`, `R-41485`, `R-41493`, `R-41539`, `R-41572`, `R-41582`, `R-41584`
