/// <reference types="@cloudflare/workers-types" />

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.left_content && !body.right_content) {
    throw createError({ statusCode: 400, message: 'At least one config is required' });
  }

  const id = generateId();
  const deleteToken = generateDeleteToken();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 30 * 24 * 60 * 60; // 30 days

  const DB = event.context.cloudflare.env.DB as D1Database;

  await DB.prepare(
    `INSERT INTO comparisons (id, left_content, right_content, format, filters, created_at, expires_at, view_count, delete_token)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
  )
    .bind(
      id,
      body.left_content || '',
      body.right_content || '',
      body.format || 'auto',
      body.filters ? JSON.stringify(body.filters) : null,
      now,
      expiresAt,
      deleteToken
    )
    .run();

  return { id, deleteToken };
});
