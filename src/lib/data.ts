import { db, isClient, Category, Notestack, Note, NoteToStack } from './db';
import type { Comment } from './db';

export async function seedDefaultCategories() {
  if (!isClient || !db) return;
  if (await db.categories.count()) return;
  const now = new Date();
  const names = ['Hobbies', 'Projects', 'Books', 'Thoughts'];
  await db.categories.bulkAdd(names.map(name => ({ name, createdAt: now, updatedAt: now }) as Category));
}

export async function listCategories() {
  if (!isClient || !db) return [] as Category[];
  return db.categories.orderBy('createdAt').toArray();
}

export type StackSortKey = 'created' | 'updated' | 'title';
export async function listStacksByCategory(categoryId: number, sort: StackSortKey) {
  if (!isClient || !db) return [] as Notestack[];
  const s = await db.notestacks.where({ categoryId }).toArray();
  return s.sort((a, b) => sort === 'title'
    ? a.title.localeCompare(b.title)
    : (sort === 'updated'
      ? b.updatedAt.getTime() - a.updatedAt.getTime()
      : a.createdAt.getTime() - b.createdAt.getTime()));
}

export async function createStackWithTitleCard(categoryId: number, title: string) {
  if (!isClient || !db) throw new Error('DB is client-only');
  const now = new Date();
  const stackId = await db.notestacks.add({ title, categoryId, createdAt: now, updatedAt: now } as Notestack);
  const titleNoteId = await db.notes.add({ content: `# ${title}\n\n*(title card)*`, createdAt: now, updatedAt: now } as Note);
  await db.noteToStack.add({ noteId: titleNoteId, stackId, isTitleCard: true } as NoteToStack);
  return stackId;
}

export type NoteSortKey = 'created' | 'updated' | 'title';
export async function listNotesForStack(stackId: number, sort: NoteSortKey) {
  if (!isClient || !db) return [] as { note: Note; isTitleCard: boolean }[];
  const map = await db.noteToStack.where({ stackId }).toArray();
  const rows = (await db.notes.bulkGet(map.map(m => m.noteId)))
    .map((n, i) => ({ note: n!, isTitleCard: map[i].isTitleCard }))
    .filter(r => !!r.note);
  return rows.sort((a, b) => sort === 'title'
    ? extractTitle(a.note.content).localeCompare(extractTitle(b.note.content))
    : (sort === 'updated'
      ? b.note.updatedAt.getTime() - a.note.updatedAt.getTime()
      : a.note.createdAt.getTime() - b.note.createdAt.getTime())); // created old→new (title card first)
}

export function extractTitle(md: string): string {
  const line = (md.split('\n').find(l => l.trim()) || '').trim();
  return line.replace(/^#+\s*/, '') || '(untitled)';
}

export async function createNoteInStack(stackId: number) {
  if (!isClient || !db) throw new Error('DB is client-only');
  const now = new Date();
  const noteId = await db.notes.add({ content: '', createdAt: now, updatedAt: now } as Note);
  await db.noteToStack.add({ noteId, stackId, isTitleCard: false });
  return noteId;
}

export async function getNote(noteId: number) {
  if (!isClient || !db) return null;
  return db.notes.get(noteId);
}
export async function updateNote(noteId: number, content: string) {
  if (!isClient || !db) return;
  return db.notes.update(noteId, { content, updatedAt: new Date() });
}

/* -------- Comments (no archive) -------- */
const CURRENT_USER = 'me';
export function currentUser() { return CURRENT_USER; }

export async function addComment(
  noteId: number, parentId: number | null, text: string, author = CURRENT_USER
): Promise<Comment | null> {
  if (!isClient || !db) return null;
  const now = new Date();
  const payload: Comment = { noteId, parentId, author, text, createdAt: now, isPrimaryChild: false, archived: false, archivedAt: null };
  const id = await db.comments.add(payload as any);
  return { ...payload, id } as Comment;
}

export async function listComments(noteId: number, parentId: number | null) {
  if (!isClient || !db) return [] as Comment[];
  return db.comments.where('noteId').equals(noteId).and(c => c.parentId === parentId && !c.archived).sortBy('createdAt');
}

export async function getCommentById(id: number) {
  if (!isClient || !db) return null;
  return db.comments.get(id);
}

export async function setPrimaryChild(parentId: number, childId: number) {
  if (!isClient || !db) return;
  await db.transaction('rw', db.comments, async () => {
    const sibs = await db.comments.where('parentId').equals(parentId).toArray();
    await Promise.all(sibs.map(s => db.comments.update(s.id!, { isPrimaryChild: s.id === childId })));
  });
}

export async function getPrimaryChild(parentId: number) {
  if (!isClient || !db) return null;
  return db.comments.where('parentId').equals(parentId).filter(c => c.isPrimaryChild && !c.archived).first();
}

export async function computePrimaryThreadFrom(commentId: number) {
  if (!isClient || !db) return [] as Comment[];
  const path: Comment[] = [];
  let cur = await db.comments.get(commentId);
  while (cur) {
    path.push(cur);
    const pc = await getPrimaryChild(cur.id!);
    if (!pc) break;
    cur = pc;
  }
  return path;
}

/* -------- Previews -------- */
export async function getTopComment(noteId: number) {
  const list = await listComments(noteId, null);
  return list.at(-1) || null; // newest top-level
}

export async function listNotePreviews(stackId: number) {
  const rows = await listNotesForStack(stackId, 'created');
  const withTop = await Promise.all(rows.map(async r => ({ ...r, topComment: await getTopComment(r.note.id!) })));
  return withTop;
}
