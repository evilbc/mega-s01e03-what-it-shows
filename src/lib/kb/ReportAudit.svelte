<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { causeOf, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  const raw = (reports as Report[]).filter((r) => r.mergedInto === 4471);
  const merged = uniqueById(raw);
  const mismatches = merged.filter((r) => causeOf(r, tenantOf(r)) !== r.meta.intakeTag);
  const anomalies = merged.filter((r) => notes.oneDayMove.includes(r.id));
  const firstMerge = merged.flatMap((r) => r.mergedAt ? [r.mergedAt.slice(0, 10)] : []).sort()[0];
  const receivedBefore = merged.filter((r) => r.receivedAt.slice(0, 10) < firstMerge).length;
  const mergedOnFirstDay = merged.filter((r) => r.mergedAt?.slice(0, 10) === firstMerge).length;
  const ordered = [...merged].sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
</script>

<p>
  The export has <strong>{raw.length}</strong> rows, but <strong>{merged.length}</strong>
  unique report IDs. Its overlapping export pages repeat <strong>{raw.length - merged.length}</strong>
  rows. Count each ID once. Tenant locale and form version disagree with intake's guessed
  cause on <strong>{mismatches.length}</strong> reports.
</p>

<h3>Received is not merged</h3>

<p>
  Reports span <time>{ordered[0].receivedAt.slice(0, 10)}</time> through
  <time>{ordered[ordered.length - 1].receivedAt.slice(0, 10)}</time>.
  Before the first merge date, <time>{firstMerge}</time>, the desk already had
  <strong>{receivedBefore}</strong> reports. It merged <strong>{mergedOnFirstDay}</strong>
  reports that day. That merge peak is a queue-processing event, not evidence that the
  product first broke that day.
</p>

<h3>Unexplained timing reports</h3>

<p>
  The desk flagged <strong>{anomalies.length}</strong> reports in
  <code>desk-notes.json</code>. The current tenant/channel rule files them under
  <code>parser</code>, so they remain in that count, not in an additional count.
  Their bodies do not establish month/day reversal. One reports an invite before its
  booking. Do not claim a timezone, daylight-saving, or other root cause from this export.
  Investigate these reports and split any independently reproduced cause.
</p>

<table>
  <thead><tr><th>Report</th><th>Tenant</th><th>What the reporter wrote</th></tr></thead>
  <tbody>
    {#each anomalies as report (report.id)}
      <tr>
        <td><code>{report.id}</code></td>
        <td>{report.tenant}</td>
        <td>{report.body}</td>
      </tr>
    {/each}
  </tbody>
</table>
