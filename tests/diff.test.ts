import { describe, it, expect } from 'vitest';
import { semanticDiff } from '../app/utils/diff/semantic.ts';
import { parseEnv, parseJson, parseYaml } from '../app/utils/parsers/index.ts';

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
