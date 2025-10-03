import { db, isClient, Category, Stack, Note, Comment } from './db';

const ME = 'me';
const uuid = () => crypto.randomUUID();

/* seed */
export async function seedDefaults() {
  if (!isClient || !db) return;
  if (await db.categories.count()) return;
  const now = new Date();
  const names = ['Hobbies', 'Projects', 'Media', 'Thoughts'];
  await db.categories.bulkAdd(
    names.map(name => ({ name, createdAt: now, updatedAt: now } as Category))
  );
}

/* board */
export async function listCategories(): Promise<Category[]> {
  return db ? db.categories.orderBy('createdAt').toArray() : [];
}
export async function listStacksByCategory(categoryId: number): Promise<Stack[]> {
  if (!db) return [];
  const s = await db.stacks.where({ categoryId }).toArray();
  return s.sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Updated desc
}
export async function createStack(categoryId: number, title: string): Promise<number> {
  const now = new Date();
  return db!.stacks.add({ uid: uuid(), title, categoryId, createdAt: now, updatedAt: now } as Stack);
}

/* stacks+notes */
export type NoteSort = 'created'|'updated'|'title';
export async function getStack(id: number) { return db?.stacks.get(id) ?? null; }
export async function listNotes(stackId: number, sort: NoteSort): Promise<Note[]> {
  if (!db) return [];
  const notes = await db.notes.where({ stackId }).toArray();
  return notes.sort((a,b) =>
    sort==='title'   ? titleOf(a.content).localeCompare(titleOf(b.content)) :
    sort==='updated' ? b.updatedAt.getTime() - a.updatedAt.getTime() :
                       b.createdAt.getTime() - a.createdAt.getTime()
  );
}
export async function createNote(stackId: number): Promise<number> {
  const now = new Date();
  return db!.notes.add({ uid: uuid(), stackId, content: '', createdAt: now, updatedAt: now } as Note);
}
export async function getNote(id: number) { return db?.notes.get(id) ?? null; }
export async function updateNote(id: number, content: string) {
  if (!db) return;
  const n = await db.notes.get(id); if (!n) return;
  const now = new Date();
  await db.transaction('rw', db.notes, db.stacks, async () => {
    await db!.notes.update(id, { content, updatedAt: now });
    await db!.stacks.update(n.stackId, { updatedAt: now }); // bump stack for board order
  });
}

/* comments: top-level + one-level replies */
export async function listTopComments(noteId: number): Promise<Comment[]> {
  if (!db) return [];
  const arr = await db.comments
    .where('noteId').equals(noteId)
    .and(c => c.parentId === null)
    .sortBy('createdAt');
  return arr.reverse();
}
export async function listReplies(noteId: number, parentId: number): Promise<Comment[]> {
  if (!db) return [];
  return db.comments
    .where('parentId').equals(parentId)
    .and(c => c.noteId === noteId)
    .sortBy('createdAt');
}
export async function addComment(noteId: number, parentId: number | null, text: string): Promise<Comment> {
  const now = new Date();
  const payload: Comment = { uid: uuid(), noteId, parentId, author: ME, text, createdAt: now };
  const id = await db!.comments.add(payload as any);
  return { ...payload, id };
}
export async function deleteCommentCascade(id: number) {
  if (!db) return;
  await db.transaction('rw', db.comments, async () => {
    const parent = await db!.comments.get(id); if (!parent) return;
    const kids = await db!.comments.where({ parentId: id }).toArray();
    await db!.comments.delete(id);
    await db!.comments.bulkDelete(kids.map(k => k.id!));
  });
}

/* helpers */
export function titleOf(text: string): string {
  const first = (text.split('\n').find(l => l.trim()) || '').trim();
  return first || '(untitled)';
}
export function snippet(text: string, n = 240) {
  const s = text.replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n) + '…' : s;
}
