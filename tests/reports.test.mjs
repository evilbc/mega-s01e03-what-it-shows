import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { causeOf, dayFirst, groupByCause, sameCause, uniqueById } from '../src/lib/kb/causes.ts';
import { deskRef } from '../src/lib/kb/desk-ref.ts';

const data = new URL('../src/lib/data/', import.meta.url);
const load = async (name) => JSON.parse(await readFile(new URL(name, data), 'utf8'));
const raw = await load('reports-4471.json');
const reports = uniqueById(raw).filter((r) => r.mergedInto === 4471);
const tenants = new Map(await Promise.all(
  (await readdir(new URL('tenants/', data))).map(async (file) => {
    const tenant = await load(`tenants/${file}`);
    return [tenant.handle, tenant];
  })
));
const groups = groupByCause(reports, (r) => tenants.get(r.tenant));

test('overlapping export rows do not inflate the report count', () => {
  assert.equal(raw.length, 427);
  assert.equal(reports.length, 412);
  for (const row of raw) assert.deepEqual(row, reports.find((r) => r.id === row.id));
});

test('tenant-aware cause counts partition all report IDs exactly once', () => {
  assert.deepEqual(groups.map((g) => [g.cause, g.reports.length]), [['parser', 379], ['hint', 33]]);
  const ids = groups.flatMap((g) => g.reports.map((r) => r.id));
  assert.equal(ids.length, 412);
  assert.equal(new Set(ids).size, 412);
  assert.equal(reports.filter((r) => causeOf(r, tenants.get(r.tenant)) !== r.meta.intakeTag).length, 38);
});

test('classification uses tenant locale, form version, and channel', () => {
  assert.equal(dayFirst('de-DE'), true);
  assert.equal(dayFirst('en-US'), false);
  const alder = tenants.get('alder.physio');
  assert.equal(causeOf({ channel: 'form' }, alder), 'hint');
  assert.equal(causeOf({ channel: 'app' }, alder), 'parser');
  assert.equal(causeOf({ channel: 'email' }, alder), 'parser');
  assert.equal(causeOf({ channel: 'form' }, tenants.get('morrow.tax')), 'parser');
  assert.equal(causeOf({ channel: 'form' }, { ...alder, locale: 'en-US' }), null);
});

test('unknown tenants and different causes are not duplicates', () => {
  assert.equal(causeOf({ channel: 'email' }, undefined), null);
  assert.equal(sameCause({ channel: 'email' }, undefined, { channel: 'email' }, undefined), false);
  const alder = tenants.get('alder.physio');
  assert.equal(sameCause({ channel: 'app' }, alder, { channel: 'form' }, alder), false);
});

test('timing anomalies remain visible without inventing their root cause', async () => {
  const notes = await load('desk-notes.json');
  assert.equal(notes.oneDayMove.length, 5);
  for (const id of notes.oneDayMove) {
    const report = reports.find((r) => r.id === id);
    assert.ok(report);
    assert.equal(causeOf(report, tenants.get(report.tenant)), 'parser');
  }
});

test('desk reference derives from the exact signature', () => {
  const signature = 'evilbc + GitHub Copilot, S01E03';
  assert.match(deskRef(signature), /^DR-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  assert.equal(deskRef(` ${signature} `), deskRef(signature));
  assert.notEqual(deskRef('unsigned'), deskRef(signature));
});
