import { describe, it, expect } from 'vitest';
import { semanticDiff } from '../app/utils/diff/semantic.ts';
import { rawDiff } from '../app/utils/diff/raw.ts';
import { parseEnv, parseJson, parseYaml } from '../app/utils/parsers/index.ts';

describe('rawDiff', () => {
  it('produces a diff string without ignoreWhitespace', () => {
    const result = rawDiff('foo  bar', 'foo bar');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('ignoreWhitespace=false shows leading/trailing differences', () => {
    const diff = rawDiff('  foo\n', 'foo\n');
    // The unified diff header contains + and - but content diff should be visible
    expect(diff).toContain('-  foo');
  });

  it('collapseWhitespace=true normalizes all whitespace', () => {
    // Both strings collapse to 'foo bar', so no content differences
    const diff = rawDiff('foo   bar\n', 'foo bar\n', { ignoreWhitespace: true });
    // Check for actual content diff markers, not header characters
    expect(diff).not.toMatch(/^\+foo bar$/m);
    expect(diff).not.toMatch(/^-foo bar$/m);
  });

  it('collapseWhitespace=true ignores added internal spaces', () => {
    const diff = rawDiff('a b\n', 'a  b\n', { ignoreWhitespace: true });
    expect(diff).not.toMatch(/^\+a {2}b$/m);
  });

  it('collapseWhitespace=true ignores newlines and tabs mixed with spaces', () => {
    const diff = rawDiff('foo\n  bar\tbaz\n', 'foo bar baz\n', { ignoreWhitespace: true });
    // After collapse: both are 'foo bar baz', no content diff
    expect(diff).not.toMatch(/^\+foo bar baz$/m);
  });

  it('reports actual text differences when ignoreWhitespace is false', () => {
    const diff = rawDiff('foo\n', 'bar\n', { ignoreWhitespace: false });
    expect(diff).toMatch(/^-foo$/m);
    expect(diff).toMatch(/^\+bar$/m);
  });
});

describe('semanticDiff', () => {
  it('detects added keys', () => {
    const left = parseEnv('FOO=bar');
    const right = parseEnv('FOO=bar\nBAZ=qux');
    const changes = semanticDiff(left, right);
    expect(changes.find(c => c.path === 'BAZ')?.type).toBe('added');
  });

  it('detects removed keys', () => {
    const left = parseEnv('FOO=bar\nBAZ=qux');
    const right = parseEnv('FOO=bar');
    const changes = semanticDiff(left, right);
    expect(changes.find(c => c.path === 'BAZ')?.type).toBe('removed');
  });

  it('detects changed values', () => {
    const left = parseEnv('PORT=3000');
    const right = parseEnv('PORT=8080');
    const changes = semanticDiff(left, right);
    const portChange = changes.find(c => c.path === 'PORT');
    expect(portChange?.type).toBe('changed');
    // env parser preserves string values
    expect(portChange?.oldValue).toBe('3000');
    expect(portChange?.newValue).toBe('8080');
  });

  it('marks unchanged keys as unchanged', () => {
    const left = parseEnv('FOO=bar\nBAZ=qux');
    const right = parseEnv('FOO=bar\nBAZ=qux');
    const changes = semanticDiff(left, right);
    expect(changes.every(c => c.type === 'unchanged')).toBe(true);
  });

  it('is order-independent for object keys', () => {
    const left = parseJson('{"a":"1","b":"2","c":"3"}');
    const right = parseJson('{"c":"3","a":"1","b":"2"}');
    const changes = semanticDiff(left, right);
    expect(changes.every(c => c.type === 'unchanged')).toBe(true);
  });

  it('handles deep nested JSON changes', () => {
    const left = parseJson('{"compilerOptions":{"strict":true,"outDir":"./dist"}}');
    const right = parseJson('{"compilerOptions":{"strict":false,"outDir":"./dist"}}');
    const changes = semanticDiff(left, right);
    const strictChange = changes.find(c => c.path === 'compilerOptions.strict');
    expect(strictChange?.type).toBe('changed');
    expect(strictChange?.oldValue).toBe(true);
    expect(strictChange?.newValue).toBe(false);
  });

  it('detects new nested keys in YAML', () => {
    const left = parseYaml('server:\n  port: 3000');
    const right = parseYaml('server:\n  port: 3000\n  host: localhost');
    const changes = semanticDiff(left, right);
    expect(changes.find(c => c.path === 'server.host')?.type).toBe('added');
  });
});
