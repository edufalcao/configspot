/// <reference types="@cloudflare/workers-types" />

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const query = getQuery(event);
  const token = query.token as string;

  if (!token) {
    throw createError({ statusCode: 400, message: 'Delete token is required' });
  }

  const DB = event.context.cloudflare.env.DB as D1Database;

  const row = await DB.prepare('SELECT delete_token FROM comparisons WHERE id = ?')
    .bind(id)
    .first();

  if (!row) {
    throw createError({ statusCode: 404, message: 'Comparison not found' });
  }

  if (row.delete_token !== token) {
    throw createError({ statusCode: 403, message: 'Invalid delete token' });
  }

  await DB.prepare('DELETE FROM comparisons WHERE id = ?')
    .bind(id)
    .run();

  return { deleted: true };
});
