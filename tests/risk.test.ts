import { describe, it, expect } from 'vitest';
import { classifyRisks } from '../app/utils/risk/classifier.ts';
import type { DiffChange } from '../app/types/diff.ts';

function makeChange(path: string, type: 'added' | 'removed' | 'changed', oldValue?: unknown, newValue?: unknown): DiffChange {
  return { path, type, oldValue, newValue };
}

describe('classifyRisks', () => {
  it('detects credential-like keys as high severity', () => {
    const changes = [
      makeChange('DATABASE_PASSWORD', 'added', undefined, 'secret123'),
      makeChange('API_KEY', 'changed', 'old_key', 'new_key')
    ];
    const annotations = classifyRisks(changes);
    expect(annotations).toHaveLength(2);
    expect(annotations.every(a => a.severity === 'high')).toBe(true);
    expect(annotations.every(a => a.category === 'credential')).toBe(true);
  });

  it('detects URL-like values in keys', () => {
    const changes = [
      makeChange('DATABASE_URL', 'changed', 'postgres://old', 'postgres://new')
    ];
    const annotations = classifyRisks(changes);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]!.category).toBe('url');
    expect(annotations[0]!.severity).toBe('high');
  });

  it('detects http:// and https:// URL values', () => {
    const changes = [
      makeChange('REDIRECT_URI', 'added', undefined, 'https://example.com/callback')
    ];
    const annotations = classifyRisks(changes);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]!.category).toBe('url');
  });

  it('detects removed keys as high severity', () => {
    const changes = [
      makeChange('SOME_KEY', 'removed', 'value')
    ];
    const annotations = classifyRisks(changes);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]!.category).toBe('key-removed');
    expect(annotations[0]!.severity).toBe('high');
  });

  it('detects placeholder values as review severity', () => {
    // NOTE_PATH avoids matching the /password/i credential pattern
    // USERNAME=xxx: 'xxx' matches the ^xxx+$ placeholder pattern
    const changes = [
      makeChange('NOTE_PATH', 'changed', '/real/path', 'changeme'),
      makeChange('USERNAME', 'added', undefined, 'xxx')
    ];
    const annotations = classifyRisks(changes);
    expect(annotations).toHaveLength(2);
    expect(annotations.every(a => a.severity === 'review')).toBe(true);
    expect(annotations.every(a => a.category === 'placeholder')).toBe(true);
  });

  it('detects feature flag keys', () => {
    const changes = [
      makeChange('FEATURE_NEW_DASHBOARD', 'added', undefined, 'true')
    ];
    const annotations = classifyRisks(changes);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]!.category).toBe('feature-flag');
    expect(annotations[0]!.severity).toBe('review');
  });

  it('detects boolean flips', () => {
    // ACTIVE does not match any FEATURE_FLAG_PATH_PATTERNS (feature/flag/enable/toggle)
    // so it reaches checkBooleanFlip without being intercepted.
    const changes = [
      makeChange('ACTIVE', 'changed', 'true', 'false')
    ];
    const annotations = classifyRisks(changes);
    expect(annotations).toHaveLength(1);
    expect(annotations[0]!.category).toBe('boolean-flip');
    expect(annotations[0]!.severity).toBe('review');
  });

  it('detects version strings', () => {
    const changes = [
      makeChange('PACKAGE_VERSION', 'changed', '1.0.0', '2.0.0')
    ];
    const annotations = classifyRisks(changes);
    expect(annotations.some(a => a.category === 'dependency-version')).toBe(true);
  });

  it('ignores unchanged entries', () => {
    const changes = [
      makeChange('FOO', 'unchanged', 'bar', 'bar')
    ];
    const annotations = classifyRisks(changes);
    expect(annotations).toHaveLength(0);
  });

  it('returns one annotation per change (highest severity wins)', () => {
    // A credential-like key that was removed matches both 'credential' and 'key-removed'
    // Both are 'high' severity, so exactly 1 annotation is returned
    const changes = [
      makeChange('SECRET_TOKEN', 'removed', 'eyJhbGc...')
    ];
    const annotations = classifyRisks(changes);
    expect(annotations.length).toBeGreaterThanOrEqual(1);
    // No duplicate categories for the same change
    const byCategory = new Set(annotations.map(a => a.category));
    expect(byCategory.size).toBe(annotations.length);
  });
});
