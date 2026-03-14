import type { DiffChange } from '~/types/diff';
import type { RiskAnnotation, RiskCategory, RiskSeverity } from '~/types/risk';

// ---------------------------------------------------------------------------
// Pattern definitions for each risk category
// ---------------------------------------------------------------------------

const CREDENTIAL_PATH_PATTERNS = [
  /secret/i, /password/i, /token/i, /api_key/i, /private_key/i, /credentials/i
];

const URL_PATH_PATTERNS = [/url/i, /host/i, /endpoint/i, /domain/i];
const URL_VALUE_PATTERN = /^https?:\/\//i;

const PORT_PATH_PATTERN = /port/i;
const COMMON_PORTS = new Set([
  80, 443, 3000, 3306, 5432, 5433, 6379, 8080, 8443, 8888,
  27017, 9200, 9300, 11211, 2181, 4369, 5672, 15672, 61616
]);

const FEATURE_FLAG_PATH_PATTERNS = [/feature/i, /flag/i, /enable/i, /toggle/i];
const BOOLEAN_LIKE_VALUES = new Set(['true', 'false', 'yes', 'no', 'on', 'off', '0', '1']);

const VERSION_PATH_PATTERN = /version/i;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+/;

const THRESHOLD_PATH_PATTERNS = [
  /timeout/i, /retry/i, /limit/i, /max/i, /min/i, /pool/i
];

const PLACEHOLDER_PATTERNS = [
  /^todo$/i, /^changeme$/i, /^xxx+$/i, /^replace_me$/i,
  /^placeholder$/i, /^fixme$/i, /^change[-_]?me$/i,
  /^your[-_]?.*[-_]?here$/i
];

// ---------------------------------------------------------------------------
// Severity ordering (higher index = more severe)
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: RiskSeverity[] = ['info', 'review', 'high'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function isNumericStr(v: string): boolean {
  if (v === '') return false;
  return !Number.isNaN(Number(v)) && v.trim() !== '';
}

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(value));
}

function isBooleanLike(v: string): boolean {
  return BOOLEAN_LIKE_VALUES.has(v.toLowerCase());
}

function isPlaceholder(v: string): boolean {
  return matchesAny(v, PLACEHOLDER_PATTERNS);
}

function looksLikeUrl(v: string): boolean {
  return URL_VALUE_PATTERN.test(v);
}

function isCommonPort(v: string): boolean {
  if (!isNumericStr(v)) return false;
  return COMMON_PORTS.has(Number(v));
}

// ---------------------------------------------------------------------------
// Individual category matchers
// ---------------------------------------------------------------------------

interface CategoryMatch {
  category: RiskCategory,
  severity: RiskSeverity,
  label: string
}

function checkCredential(change: DiffChange): CategoryMatch | null {
  if (matchesAny(change.path, CREDENTIAL_PATH_PATTERNS)) {
    return {
      category: 'credential',
      severity: 'high',
      label: `Credential-related key "${change.path}" was ${change.type}`
    };
  }
  return null;
}

function checkUrl(change: DiffChange): CategoryMatch | null {
  if (matchesAny(change.path, URL_PATH_PATTERNS)) {
    return {
      category: 'url',
      severity: 'high',
      label: `URL/host key "${change.path}" was ${change.type}`
    };
  }
  const newVal = toStr(change.newValue);
  const oldVal = toStr(change.oldValue);
  if (looksLikeUrl(newVal) || looksLikeUrl(oldVal)) {
    return {
      category: 'url',
      severity: 'high',
      label: `Value of "${change.path}" looks like a URL`
    };
  }
  return null;
}

function checkPort(change: DiffChange): CategoryMatch | null {
  if (PORT_PATH_PATTERN.test(change.path)) {
    return {
      category: 'port',
      severity: 'high',
      label: `Port key "${change.path}" was ${change.type}`
    };
  }
  const newVal = toStr(change.newValue);
  const oldVal = toStr(change.oldValue);
  if (isCommonPort(newVal) || isCommonPort(oldVal)) {
    return {
      category: 'port',
      severity: 'high',
      label: `Value of "${change.path}" is a common port number`
    };
  }
  return null;
}

function checkFeatureFlag(change: DiffChange): CategoryMatch | null {
  if (matchesAny(change.path, FEATURE_FLAG_PATH_PATTERNS)) {
    return {
      category: 'feature-flag',
      severity: 'review',
      label: `Feature flag "${change.path}" was ${change.type}`
    };
  }
  const newVal = toStr(change.newValue);
  const oldVal = toStr(change.oldValue);
  if (
    (newVal && isBooleanLike(newVal))
    || (oldVal && isBooleanLike(oldVal))
  ) {
    return {
      category: 'feature-flag',
      severity: 'review',
      label: `"${change.path}" has a boolean-like value`
    };
  }
  return null;
}

function checkDependencyVersion(change: DiffChange): CategoryMatch | null {
  if (VERSION_PATH_PATTERN.test(change.path)) {
    return {
      category: 'dependency-version',
      severity: 'review',
      label: `Version key "${change.path}" was ${change.type}`
    };
  }
  const newVal = toStr(change.newValue);
  const oldVal = toStr(change.oldValue);
  if (SEMVER_PATTERN.test(newVal) || SEMVER_PATTERN.test(oldVal)) {
    return {
      category: 'dependency-version',
      severity: 'review',
      label: `Value of "${change.path}" looks like a version string`
    };
  }
  return null;
}

function checkBooleanFlip(change: DiffChange): CategoryMatch | null {
  if (change.type !== 'changed') return null;
  const oldVal = toStr(change.oldValue).toLowerCase();
  const newVal = toStr(change.newValue).toLowerCase();
  const boolStrings = new Set(['true', 'false']);
  if (boolStrings.has(oldVal) && boolStrings.has(newVal) && oldVal !== newVal) {
    return {
      category: 'boolean-flip',
      severity: 'review',
      label: `"${change.path}" flipped from ${oldVal} to ${newVal}`
    };
  }
  return null;
}

function checkThreshold(change: DiffChange): CategoryMatch | null {
  if (!matchesAny(change.path, THRESHOLD_PATH_PATTERNS)) return null;
  const newVal = toStr(change.newValue);
  const oldVal = toStr(change.oldValue);
  if (isNumericStr(newVal) || isNumericStr(oldVal)) {
    return {
      category: 'threshold',
      severity: 'review',
      label: `Threshold key "${change.path}" was ${change.type}`
    };
  }
  return null;
}

function checkKeyRemoved(change: DiffChange): CategoryMatch | null {
  if (change.type === 'removed') {
    return {
      category: 'key-removed',
      severity: 'high',
      label: `Key "${change.path}" was removed`
    };
  }
  return null;
}

function checkPlaceholder(change: DiffChange): CategoryMatch | null {
  const newVal = toStr(change.newValue);
  const oldVal = toStr(change.oldValue);
  if (isPlaceholder(newVal) || isPlaceholder(oldVal)) {
    return {
      category: 'placeholder',
      severity: 'review',
      label: `"${change.path}" contains a placeholder value`
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Ordered list of checkers — priority is determined by severity, then order
// ---------------------------------------------------------------------------

const CHECKERS: Array<(change: DiffChange) => CategoryMatch | null> = [
  checkCredential,
  checkUrl,
  checkPort,
  checkKeyRemoved,
  checkFeatureFlag,
  checkDependencyVersion,
  checkBooleanFlip,
  checkThreshold,
  checkPlaceholder
];

// ---------------------------------------------------------------------------
// Main classifier
// ---------------------------------------------------------------------------

/**
 * Classifies an array of diff changes and returns risk annotations.
 * Only annotates changes that are 'added', 'removed', or 'changed'.
 * When a single change matches multiple categories, the annotation
 * with the highest severity is returned.
 */
export function classifyRisks(changes: DiffChange[]): RiskAnnotation[] {
  const annotations: RiskAnnotation[] = [];

  for (const change of changes) {
    // Skip unchanged entries
    if (change.type === 'unchanged') continue;

    let best: CategoryMatch | null = null;

    for (const checker of CHECKERS) {
      const match = checker(change);
      if (!match) continue;

      if (
        !best
        || SEVERITY_ORDER.indexOf(match.severity)
        > SEVERITY_ORDER.indexOf(best.severity)
      ) {
        best = match;
      }
    }

    if (best) {
      annotations.push({
        change,
        severity: best.severity,
        category: best.category,
        label: best.label
      });
    }
  }

  return annotations;
}
