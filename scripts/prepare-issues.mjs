import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { groupByCause, uniqueById } from '../src/lib/kb/causes.ts';

const root = new URL('../', import.meta.url);
const load = async (relative) => JSON.parse(await readFile(new URL(relative, root), 'utf8'));
const raw = await load('src/lib/data/reports-4471.json');
const tenants = new Map(await Promise.all(
  (await readdir(new URL('src/lib/data/tenants/', root))).map(async (file) => {
    const tenant = await load(`src/lib/data/tenants/${file}`);
    return [tenant.handle, tenant];
  })
));
const groups = groupByCause(
  uniqueById(raw).filter((r) => r.mergedInto === 4471),
  (r) => tenants.get(r.tenant)
);

const descriptions = {
  parser: `The shared parser interprets dates month first, contrary to the day-first tenant's date convention. This is not the newer booking form's misleading hint.

## Reproduction and expected behavior

For Harbour Dental (tenant locale \`en-GB\`), enter \`07/04/2026\` for 7 April through the shared parser path. The current month-first parser produces 4 July. The expected date is 7 April. Use the tenant locale, not the reporter's browser locale.

Implement parsing against an explicit tenant convention or unambiguous input. Preserve month-first tenants. Test app, email, and booking-v2 entry paths separately from the booking-v3 hint.

## Evidence and uncertainty

- \`R-41200\` and correction \`R-41201\` describe April/July reversal. They are distinct IDs, not overlapping export rows.
- \`R-41205\` is Morrow Tax, \`fr-FR\`, booking-v2, app. Intake's browser locale is \`en-US\` and its tag says \`hint\`, but the tenant-aware rule assigns \`parser\`.
- The desk's five flagged reports are \`R-41202\`, \`R-41209\`, \`R-41236\`, \`R-41344\`, and \`R-41620\`. Their bodies describe one-day shifts, inconsistent timing, and an invite before booking. They remain in this group's count because that is how the exported classifier files them. A parser explanation is unproven for these reports. Investigate independently; do not assert a timezone or daylight-saving cause.
- The count is report membership, not verified reproductions or unique affected customers.

## Acceptance criteria

Day-first input keeps the intended day and month on the shared parser paths. Month-first tenants retain their intended behavior. Tests distinguish this parser failure from the booking-v3 hint issue. Investigate the five atypical reports and move any independently reproduced cause to its own issue without counting an ID twice.`,
  hint: `The booking-v3 date field prints \`MM/DD/YYYY\` for day-first tenants. People who follow that hint enter month first, but the form reads the tenant's day-first convention. This is distinct from the shared parser reading month first.

## Reproduction and expected behavior

Use Alder Physio (\`de-DE\`, booking-v3), Copper Studio (\`es-ES\`, booking-v3), or Pale Harbour (\`pt-PT\`, booking-v3) through the \`form\` channel. The hint says \`MM/DD/YYYY\`. To book 7 April, follow it and enter \`04/07/2026\`. The day-first form instead reads 4 July.

The hint must agree with the date convention the form actually accepts. Fix and test the hint and parsing together for every supported tenant convention. Fixing only the shared parser does not resolve misleading form instructions.

## Evidence

- \`R-41230\`, Copper Studio, form, is tagged \`parser\` by intake but belongs to \`hint\` by tenant locale and form version.
- \`R-41241\`, Alder Physio, form, reports June/August reversal.
- \`R-41251\`, Pale Harbour, form, reports January/July reversal and is also mis-tagged \`parser\`.
- Non-form reports at these same tenants belong to the shared parser group under the exported rule. Do not count every report at a booking-v3 tenant here.

## Acceptance criteria

The displayed date hint and actual form parser agree for day-first and month-first tenants. Following the hint preserves the selected date. Cover all three affected booking-v3 tenants and retain correct booking-v2 behavior. Keep the shared parser fix tracked separately.`
};

await mkdir(new URL('issues/', root), { recursive: true });
for (const group of groups) {
  if (!(group.cause in descriptions)) throw new Error(`Unplaced cause: ${group.cause}`);
  const body = `## Scope and report count

**${group.reports.length} unique reports** merged into original support ticket **#4471** belong to \`${group.cause}\` under the KB's tenant-aware classification. ${group.tenants} tenants. First received ${group.firstSeen}; last received ${group.lastSeen}.

Deduplicate the overlapping export by report ID before filtering \`mergedInto === 4471\`. The full export has ${raw.length} rows and ${uniqueById(raw).length} unique reports. Do not use intake tags as causes. This group's intake tags are ${Object.entries(group.taggedAs).map(([tag, count]) => `${tag}: ${count}`).join(', ')}.

${descriptions[group.cause]}

## Reproducible sources

See \`src/lib/data/reports-4471.json\`, \`src/lib/data/tenants/*.json\`, \`src/lib/kb/causes.ts\`, and \`src/lib/kb/locales.ts\`. Recompute with \`npm run prepare-issues\`. This is an analysis of the supplied export, not a claim that production was changed.

The signed KB source is \`src/routes/kb/decisions/0002-dedupe-by-cause/+page.svx\`. Its actual prerendered page is \`rendered/kb/decisions/0002-dedupe-by-cause/index.html\`.

## Report IDs

${group.reports.map((r) => `\`${r.id}\``).join(', ')}
`;
  const output = new URL(`issues/${group.cause}.md`, root);
  await writeFile(output, body);
  console.log(`${group.cause}: ${group.reports.length} reports -> ${fileURLToPath(output)}`);
}
