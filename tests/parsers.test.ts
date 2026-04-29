import { describe, it, expect } from 'vitest';
import { parseEnv, parseJson, parseYaml, parseToml, parseIni } from '../app/utils/parsers/index.ts';

describe('parseEnv', () => {
  it('parses basic KEY=VALUE pairs', () => {
    const result = parseEnv('FOO=bar\nBAZ=qux');
    expect(result.format).toBe('env');
    expect(result.errors).toHaveLength(0);
    const entries = Object.fromEntries(result.entries.map(e => [e.key, e.value]));
    expect(entries).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('handles export prefix', () => {
    const result = parseEnv('export DATABASE_URL=postgres://localhost\nAPI_KEY=secret');
    const entries = Object.fromEntries(result.entries.map(e => [e.key, e.value]));
    expect(entries).toEqual({ DATABASE_URL: 'postgres://localhost', API_KEY: 'secret' });
  });

  it('handles quoted values', () => {
    const result = parseEnv('KEY="quoted value"\nANOTHER=\'single quoted\'');
    const entries = Object.fromEntries(result.entries.map(e => [e.key, e.value]));
    expect(entries).toEqual({ KEY: 'quoted value', ANOTHER: 'single quoted' });
  });

  it('strips inline comments from unquoted values', () => {
    const result = parseEnv('PORT=8080 # default port\nHOST=localhost');
    const entries = Object.fromEntries(result.entries.map(e => [e.key, e.value]));
    expect(entries).toEqual({ PORT: '8080', HOST: 'localhost' });
  });

  it('reports errors for invalid lines', () => {
    const result = parseEnv('NOT_A_VALID_LINE\nVALID=good');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.line).toBe(1);
  });
});

describe('parseJson', () => {
  it('parses a simple JSON object', () => {
    const result = parseJson('{"name":"configspot","version":"1.0.0"}');
    expect(result.format).toBe('json');
    expect(result.errors).toHaveLength(0);
    const entries = Object.fromEntries(result.entries.map(e => [e.key, e.value]));
    expect(entries).toEqual({ name: 'configspot', version: '1.0.0' });
  });

  it('flattens nested objects into dot-paths', () => {
    const result = parseJson('{"compilerOptions":{"strict":true,"outDir":"./dist"}}');
    const entries = Object.fromEntries(result.entries.map(e => [e.path, e.value]));
    expect(entries['compilerOptions.strict']).toBe(true);
    expect(entries['compilerOptions.outDir']).toBe('./dist');
  });

  it('strips single-line JSONC comments', () => {
    const result = parseJson('// comment\n{"key":"value"} // inline');
    const entries = Object.fromEntries(result.entries.map(e => [e.key, e.value]));
    expect(entries).toEqual({ key: 'value' });
  });

  it('reports errors for invalid JSON', () => {
    const result = parseJson('{"unclosed":');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('parseYaml', () => {
  it('parses a simple YAML object', () => {
    const result = parseYaml('name: configspot\nversion: "1.0.0"');
    expect(result.format).toBe('yaml');
    expect(result.errors).toHaveLength(0);
    const entries = Object.fromEntries(result.entries.map(e => [e.key, e.value]));
    expect(entries).toEqual({ name: 'configspot', version: '1.0.0' });
  });

  it('flattens nested objects', () => {
    const result = parseYaml('server:\n  host: localhost\n  port: 3000');
    const entries = Object.fromEntries(result.entries.map(e => [e.path, e.value]));
    expect(entries['server.host']).toBe('localhost');
    expect(entries['server.port']).toBe(3000);
  });

  it('reports errors for invalid YAML', () => {
    const result = parseYaml('invalid:\n  - yaml\n :\n bad indent');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('parseToml', () => {
  it('parses a simple TOML file', () => {
    const result = parseToml('name = "configspot"\nversion = "1.0.0"');
    expect(result.format).toBe('toml');
    expect(result.errors).toHaveLength(0);
    const entries = Object.fromEntries(result.entries.map(e => [e.key, e.value]));
    expect(entries).toEqual({ name: 'configspot', version: '1.0.0' });
  });

  it('flattens nested tables into dot-paths', () => {
    const result = parseToml('[server]\nhost = "localhost"\nport = 3000');
    const entries = Object.fromEntries(result.entries.map(e => [e.path, e.value]));
    expect(entries['server.host']).toBe('localhost');
    expect(entries['server.port']).toBe(3000);
  });

  it('reports errors for invalid TOML', () => {
    const result = parseToml('[invalid\n= missing brace');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('parseIni', () => {
  it('parses a simple INI file', () => {
    const result = parseIni('[section]\nkey=value\nanother=123');
    expect(result.format).toBe('ini');
    expect(result.errors).toHaveLength(0);
    const entries = Object.fromEntries(result.entries.map(e => [e.path, e.value]));
    expect(entries['section.key']).toBe('value');
    expect(entries['section.another']).toBe('123');
  });

  it('supports top-level keys without section', () => {
    const result = parseIni('global_setting=true\n[section]\nkey=value');
    const entries = Object.fromEntries(result.entries.map(e => [e.path, e.value]));
    // ini package parses bare booleans as JS booleans
    expect(entries['global_setting']).toBe(true);
  });
});
