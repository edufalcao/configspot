import type { ConfigFormat, ConfigTree } from '~/types/config';
import type { DiffResult } from '~/types/diff';
import type { RiskAnnotation } from '~/types/risk';
import { parseConfig } from '~/utils/parsers';
import { compareConfigs } from '~/utils/diff';
import { classifyRisks } from '~/utils/risk';

export function useCompare() {
  const leftContent = ref('');
  const rightContent = ref('');
  const selectedFormat = ref<ConfigFormat | 'auto'>('auto');
  const maskSecrets = ref(true);

  const result = ref<DiffResult | null>(null);
  const risks = ref<RiskAnnotation[]>([]);
  const leftTree = ref<ConfigTree | null>(null);
  const rightTree = ref<ConfigTree | null>(null);
  const error = ref<string | null>(null);

  function compare() {
    error.value = null;
    result.value = null;
    risks.value = [];

    if (!leftContent.value.trim() && !rightContent.value.trim()) {
      error.value = 'Please provide at least one config to compare.';
      return;
    }

    const format = selectedFormat.value === 'auto' ? undefined : selectedFormat.value;

    const left = parseConfig(leftContent.value, format);
    const right = parseConfig(rightContent.value, format);

    leftTree.value = left;
    rightTree.value = right;

    if (left.errors.length > 0 || right.errors.length > 0) {
      const leftErrors = left.errors.map(e => `Original line ${e.line}: ${e.message}`);
      const rightErrors = right.errors.map(e => `Updated line ${e.line}: ${e.message}`);
      error.value = [...leftErrors, ...rightErrors].join('\n');
      return;
    }

    const diffResult = compareConfigs(left, right);
    result.value = diffResult;
    risks.value = classifyRisks(diffResult.changes);
  }

  function loadSample() {
    leftContent.value = `# Production .env — current
DATABASE_URL=postgres://prod-db.example.com:5432/myapp
REDIS_URL=redis://cache.internal:6379
API_KEY=sk_live_abc123def456
SECRET_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
PORT=8080
DEBUG=false
FEATURE_NEW_DASHBOARD=false
LOG_LEVEL=warn
MAX_POOL_SIZE=10
CDN_URL=https://cdn.example.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PASSWORD=SG.xxxxxx`;

    rightContent.value = `# Production .env — proposed changes
DATABASE_URL=postgres://new-db.example.com:5432/myapp
REDIS_URL=redis://cache.internal:6379
API_KEY=sk_live_xyz789ghi012
SECRET_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
PORT=80
DEBUG=true
FEATURE_NEW_DASHBOARD=true
LOG_LEVEL=debug
MAX_POOL_SIZE=25
CDN_URL=https://cdn-v2.example.com
SMTP_HOST=smtp.sendgrid.net
SENTRY_DSN=https://abc@sentry.io/123`;

    selectedFormat.value = 'env';
    compare();
  }

  function clear() {
    leftContent.value = '';
    rightContent.value = '';
    result.value = null;
    risks.value = [];
    error.value = null;
    leftTree.value = null;
    rightTree.value = null;
  }

  return {
    leftContent,
    rightContent,
    selectedFormat,
    maskSecrets,
    result,
    risks,
    leftTree,
    rightTree,
    error,
    compare,
    loadSample,
    clear
  };
}
