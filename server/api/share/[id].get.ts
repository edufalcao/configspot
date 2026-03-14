/// <reference types="@cloudflare/workers-types" />

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  const DB = event.context.cloudflare.env.DB as D1Database;

  const row = await DB.prepare(
    'SELECT id, left_content, right_content, format, filters, created_at, expires_at, view_count FROM comparisons WHERE id = ?'
  )
    .bind(id)
    .first();

  if (!row) {
    throw createError({ statusCode: 404, message: 'Comparison not found' });
  }

  // Increment view count
  await DB.prepare('UPDATE comparisons SET view_count = view_count + 1 WHERE id = ?')
    .bind(id)
    .run();

  return {
    id: row.id,
    left_content: row.left_content,
    right_content: row.right_content,
    format: row.format,
    filters: row.filters ? JSON.parse(row.filters as string) : null,
    created_at: row.created_at,
    view_count: (row.view_count as number) + 1
  };
});
