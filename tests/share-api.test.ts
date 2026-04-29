import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Share API tests — extracted handler logic tested with mocked D1 bindings.
// Nitro's defineEventHandler / H3 utilities are server-only (not available
// in the vitest node environment), so we test the pure handler functions.
// ---------------------------------------------------------------------------

interface MockChain {
  bind: (...args: unknown[]) => MockChain,
  run: () => Promise<unknown>,
  first: () => Promise<unknown>,
  all: () => Promise<unknown>
}

interface MockD1 {
  prepare: (sql: string) => MockChain
}

function makeMockD1(): { db: MockD1, insertSql: string, insertedArgs: unknown[] } {
  const insertedArgs: unknown[] = [];
  let insertSql = '';
  const db: MockD1 = {
    prepare(sql: string) {
      insertSql = sql;
      const chain: MockChain = {
        bind: (...args: unknown[]) => (insertedArgs.push(...args), chain),
        run: async () => ({ success: true }),
        first: async () => null,
        all: async () => ({ results: [], success: true })
      };
      return chain;
    }
  };
  return {
    db,
    get insertSql() { return insertSql; },
    get insertedArgs() { return insertedArgs; }
  };
}

function makeMockD1WithRow(row: Record<string, unknown>) {
  return {
    db: {
      prepare(_sql: string) {
        const chain: MockChain = {
          bind: () => chain,
          run: async () => ({ success: true }),
          first: async () => row,
          all: async () => ({ results: [row], success: true })
        };
        return chain;
      }
    }
  };
}

// ---------------------------------------------------------------------------
// handleSharePost — extracted from server/api/share/index.post.ts
// ---------------------------------------------------------------------------
interface SharePostEvent { left_content?: string, right_content?: string, format?: string, filters?: unknown }
interface SharePostResult { id: string, deleteToken: string }

async function sharePost(body: SharePostEvent, db: MockD1): Promise<SharePostResult> {
  if (!body.left_content && !body.right_content) {
    const err = new Error('At least one config is required') as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  const id = `id-${Date.now()}`;
  const deleteToken = `tok-${Math.random().toString(36).slice(2)}`;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 30 * 24 * 60 * 60;
  const filters = body.filters ? JSON.stringify(body.filters) : null;

  await db.prepare(
    `INSERT INTO comparisons (id, left_content, right_content, format, filters, created_at, expires_at, view_count, delete_token)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
  )
    .bind(id, body.left_content ?? '', body.right_content ?? '', body.format ?? 'auto', filters, now, expiresAt, deleteToken)
    .run();

  return { id, deleteToken };
}

// ---------------------------------------------------------------------------
// handleShareGet — extracted from server/api/share/[id].get.ts
// ---------------------------------------------------------------------------
interface ShareGetResult {
  id: string,
  left_content: string,
  right_content: string,
  format: string,
  filters: unknown,
  created_at: number,
  view_count: number
}

async function shareGet(id: string, db: MockD1): Promise<ShareGetResult> {
  const row = await db.prepare(
    'SELECT id, left_content, right_content, format, filters, created_at, expires_at, view_count FROM comparisons WHERE id = ?'
  ).bind(id).first() as Record<string, unknown> | null;

  if (!row) {
    const err = new Error('Comparison not found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  await db.prepare('UPDATE comparisons SET view_count = view_count + 1 WHERE id = ?').bind(id).run();

  return {
    id: row.id as string,
    left_content: row.left_content as string,
    right_content: row.right_content as string,
    format: row.format as string,
    filters: row.filters ? JSON.parse(row.filters as string) : null,
    created_at: row.created_at as number,
    view_count: (row.view_count as number) + 1
  };
}

// ---------------------------------------------------------------------------
// handleShareDelete — extracted from server/api/share/[id].delete.ts
// ---------------------------------------------------------------------------
async function shareDelete(id: string, token: string, db: MockD1): Promise<{ deleted: boolean }> {
  if (!token) {
    const err = new Error('Delete token is required') as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  const row = await db.prepare('SELECT delete_token FROM comparisons WHERE id = ?').bind(id).first() as { delete_token: string } | null;

  if (!row) {
    const err = new Error('Comparison not found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  if (row.delete_token !== token) {
    const err = new Error('Invalid delete token') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }
  await db.prepare('DELETE FROM comparisons WHERE id = ?').bind(id).run();
  return { deleted: true };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/share', () => {
  it('creates a share record and returns id + deleteToken', async () => {
    const { db } = makeMockD1();
    const result = await sharePost({ left_content: 'FOO=bar' }, db);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('deleteToken');
    expect(typeof result.id).toBe('string');
    expect(typeof result.deleteToken).toBe('string');
  });

  it('returns 400 when both left_content and right_content are empty', async () => {
    try {
      await sharePost({}, makeMockD1().db);
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      expect((err as { statusCode?: number }).statusCode).toBe(400);
    }
  });
});

describe('GET /api/share/:id', () => {
  it('returns the comparison record and increments view_count', async () => {
    const mockRow = {
      id: 'abc123', left_content: 'FOO=bar', right_content: 'FOO=baz',
      format: 'env', filters: null, created_at: 1710000000,
      expires_at: 1712592000, view_count: 0, delete_token: 'tok123'
    };
    let updated = false;
    const db = {
      prepare(_sql: string) {
        const chain: MockChain = {
          bind: () => chain,
          run: async () => ((updated = true), { success: true }),
          first: async () => mockRow,
          all: async () => ({ results: [mockRow], success: true })
        };
        return chain;
      }
    };
    const result = await shareGet('abc123', db);
    expect(result.id).toBe('abc123');
    expect(result.left_content).toBe('FOO=bar');
    expect(result.view_count).toBe(1);
    expect(updated).toBe(true);
  });

  it('returns 404 when comparison not found', async () => {
    const db = makeMockD1WithRow(null);
    try {
      await shareGet('nonexistent', db.db);
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      expect((err as { statusCode?: number }).statusCode).toBe(404);
    }
  });
});

describe('DELETE /api/share/:id', () => {
  it('deletes a comparison with a valid token', async () => {
    let deleted = false;
    const db = {
      prepare(_sql: string) {
        const chain: MockChain = {
          bind: () => chain,
          run: async () => ((deleted = true), { success: true }),
          first: async () => ({ delete_token: 'valid-token' }),
          all: async () => ({ results: [], success: true })
        };
        return chain;
      }
    };
    const result = await shareDelete('abc123', 'valid-token', db);
    expect(result).toEqual({ deleted: true });
    expect(deleted).toBe(true);
  });

  it('returns 403 when token is invalid', async () => {
    const db = makeMockD1WithRow({ delete_token: 'correct-token' });
    try {
      await shareDelete('abc123', 'wrong-token', db.db);
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      expect((err as { statusCode?: number }).statusCode).toBe(403);
    }
  });

  it('returns 400 when token is missing', async () => {
    const db = makeMockD1WithRow({ delete_token: 'any-token' });
    try {
      await shareDelete('abc123', '', db.db);
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      expect((err as { statusCode?: number }).statusCode).toBe(400);
    }
  });
});
