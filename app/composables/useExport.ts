import type { DiffChange, DiffResult } from '~/types/diff';
import type { RiskAnnotation } from '~/types/risk';
import { generateSummary } from '~/utils/diff';

export function useExport() {
  const exportFeedback = ref<string | null>(null);
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

  function showFeedback(message: string) {
    exportFeedback.value = message;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      exportFeedback.value = null;
    }, 2000);
  }

  async function copyToClipboard(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    showFeedback(`${label} copied!`);
  }

  async function exportRawDiff(rawDiff: string) {
    await copyToClipboard(rawDiff, 'Raw diff');
  }

  async function exportSummary(changes: DiffChange[]) {
    const summary = generateSummary(changes);
    await copyToClipboard(summary, 'Summary');
  }

  async function exportMarkdownTable(changes: DiffChange[]) {
    const filtered = changes.filter(c => c.type !== 'unchanged');
    const lines: string[] = [
      '| Key | Status | Old Value | New Value |',
      '| --- | --- | --- | --- |'
    ];

    for (const c of filtered) {
      const status = c.type.charAt(0).toUpperCase() + c.type.slice(1);
      const oldVal = formatTableValue(c.oldValue);
      const newVal = formatTableValue(c.newValue);
      lines.push(`| ${escapeMarkdown(c.path)} | ${status} | ${escapeMarkdown(oldVal)} | ${escapeMarkdown(newVal)} |`);
    }

    await copyToClipboard(lines.join('\n'), 'Markdown table');
  }

  function exportHtmlReport(result: DiffResult, risks: RiskAnnotation[]) {
    const html = buildHtmlReport(result, risks);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'configspot-report.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback('HTML report downloaded!');
  }

  return {
    exportFeedback,
    exportRawDiff,
    exportSummary,
    exportMarkdownTable,
    exportHtmlReport
  };
}

function formatTableValue(value: unknown): string {
  if (value === undefined) return '';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeMarkdown(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function buildHtmlReport(result: DiffResult, risks: RiskAnnotation[]): string {
  const summary = generateSummary(result.changes);
  const changesHtml = result.changes
    .filter(c => c.type !== 'unchanged')
    .map((c) => {
      const bgColor = c.type === 'added'
        ? '#0d2818'
        : c.type === 'removed'
          ? '#2d0f0f'
          : '#2d2000';
      const typeLabel = c.type === 'added'
        ? '<span style="color:#4ade80;">+ added</span>'
        : c.type === 'removed'
          ? '<span style="color:#f87171;">- removed</span>'
          : '<span style="color:#fbbf24;">~ changed</span>';
      const oldVal = formatTableValue(c.oldValue);
      const newVal = formatTableValue(c.newValue);
      let valueHtml = '';
      if (c.type === 'changed') {
        valueHtml = `<span style="color:#f87171;text-decoration:line-through;opacity:0.6;">${escapeHtml(oldVal)}</span> → <span style="color:#4ade80;">${escapeHtml(newVal)}</span>`;
      } else if (c.type === 'added') {
        valueHtml = `<span style="color:#4ade80;">${escapeHtml(newVal)}</span>`;
      } else {
        valueHtml = `<span style="color:#f87171;">${escapeHtml(oldVal)}</span>`;
      }
      return `<tr style="background:${bgColor};"><td style="padding:6px 12px;border-bottom:1px solid #333;">${typeLabel}</td><td style="padding:6px 12px;border-bottom:1px solid #333;font-weight:600;">${escapeHtml(c.path)}</td><td style="padding:6px 12px;border-bottom:1px solid #333;">${valueHtml}</td></tr>`;
    })
    .join('\n');

  const risksHtml = risks.length > 0
    ? risks.map((r) => {
        const color = r.severity === 'high' ? '#f87171' : r.severity === 'review' ? '#fbbf24' : '#60a5fa';
        return `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 12px;background:#1a1a2e;border-radius:6px;margin-bottom:4px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};margin-top:4px;flex-shrink:0;"></span>
        <div><strong style="color:#e2e8f0;">${escapeHtml(r.change.path)}</strong><br><span style="color:#94a3b8;font-size:0.85em;">${escapeHtml(r.label)}</span></div>
        <span style="margin-left:auto;font-size:0.75em;padding:2px 8px;border-radius:4px;background:${color}22;color:${color};">${r.severity}</span>
      </div>`;
      }).join('\n')
    : '<p style="color:#94a3b8;">No risks detected.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ConfigSpot Report</title>
<style>
  body { background:#0f0f1a; color:#e2e8f0; font-family:'JetBrains Mono',ui-monospace,monospace; margin:0; padding:32px; }
  h1 { font-size:1.4em; margin:0 0 4px; }
  h2 { font-size:1.1em; margin:24px 0 8px; color:#94a3b8; }
  .meta { color:#64748b; font-size:0.85em; margin-bottom:24px; }
  table { width:100%; border-collapse:collapse; font-size:0.9em; }
  th { text-align:left; padding:8px 12px; border-bottom:2px solid #333; color:#94a3b8; font-weight:500; }
  pre { background:#1a1a2e; padding:16px; border-radius:8px; overflow-x:auto; font-size:0.85em; white-space:pre-wrap; }
  .summary-bar { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
  .badge { padding:4px 10px; border-radius:6px; font-size:0.8em; font-weight:600; }
  .badge-added { background:#4ade8022; color:#4ade80; }
  .badge-removed { background:#f8717122; color:#f87171; }
  .badge-changed { background:#fbbf2422; color:#fbbf24; }
</style>
</head>
<body>
<h1>ConfigSpot Comparison Report</h1>
<p class="meta">Format: ${escapeHtml(result.format)} | Generated: ${new Date().toISOString()}</p>
<div class="summary-bar">
  <span class="badge badge-added">+${result.stats.added} added</span>
  <span class="badge badge-removed">-${result.stats.removed} removed</span>
  <span class="badge badge-changed">~${result.stats.changed} changed</span>
</div>
<h2>Changes</h2>
<table>
<thead><tr><th>Status</th><th>Key</th><th>Value</th></tr></thead>
<tbody>
${changesHtml}
</tbody>
</table>
<h2>Risk Analysis</h2>
${risksHtml}
<h2>Text Summary</h2>
<pre>${escapeHtml(summary)}</pre>
<h2>Raw Diff</h2>
<pre>${escapeHtml(result.rawDiff)}</pre>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
