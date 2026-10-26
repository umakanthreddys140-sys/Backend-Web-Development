/**
 * Post Repository (Map-backed in-memory implementation)
 *
 * Future Prisma-backed swap assessment:
 * ---------------------------------------------------------------------------
 * WHAT WILL CHANGE:
 * 1. Internal Storage Mechanism: The in-memory Map (`posts`) and manual ID counter
 *    (`nextId`) will be replaced by PrismaClient (`const prisma = new PrismaClient()`).
 * 2. Method Implementations:
 *    - findAll(): Will call `prisma.post.findMany()`.
 *    - findById(id): Will call `prisma.post.findUnique({ where: { id: Number(id) } })`.
 *    - create(fields): Will call `prisma.post.create({ data: fields })`, where the
 *      database handles auto-incrementing ID generation.
 *    - update(id, patch): Will call `prisma.post.update({ where: { id: Number(id) }, data: patch })`.
 *    - remove(id): Will call `prisma.post.delete({ where: { id: Number(id) } })`.
 * 3. Asynchrony: Methods will become async (returning Promises), requiring services
 *    to await repository calls.
 *
 * WHAT WILL REMAIN UNCHANGED:
 * 1. Interface & Method Signatures: The five public operations (`findAll`, `findById`,
 *    `create`, `update`, `remove`) will retain their exact names, parameter shapes,
 *    and contract.
 * 2. Return Data Contracts: Callers will continue to receive arrays (empty if none),
 *    records or null for lookups/updates, full records with generated IDs on create,
 *    and boolean flags for deletions.
 * 3. Service Layer & Controllers: `postService.js` and `postController.js` will retain
 *    their architectural roles, business validations (e.g. title requirement, 422 error),
 *    and response structures without needing rewrites for database specifics.
 * ---------------------------------------------------------------------------
 */

const posts = new Map([
  [1, { id: 1, title: 'First post', body: 'Repository boundaries protect change.', authorId: 7 }],
  [2, { id: 2, title: 'Second post', body: 'Services should speak in domain language.', authorId: 8 }],
]);

let nextId = 3;

function findAll() {
  return Array.from(posts.values()).map((post) => ({ ...post }));
}

function findById(id) {
  const post = posts.get(Number(id));
  return post ? { ...post } : null;
}

function create(fields) {
  const id = nextId++;
  const post = {
    id,
    title: fields?.title,
    body: fields?.body || '',
    authorId: fields?.authorId,
  };
  posts.set(id, post);
  return { ...post };
}

function update(id, patch) {
  const post = posts.get(Number(id));
  if (!post) return null;
  const updated = {
    ...post,
    ...(patch?.title !== undefined && { title: patch.title }),
    ...(patch?.body !== undefined && { body: patch.body }),
    ...(patch?.authorId !== undefined && { authorId: patch.authorId }),
  };
  posts.set(post.id, updated);
  return { ...updated };
}

function remove(id) {
  const numId = Number(id);
  if (!posts.has(numId)) return false;
  return posts.delete(numId);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
