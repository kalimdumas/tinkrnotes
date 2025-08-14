import { db, isClient, Category, Notestack, Note, NoteToStack } from './db';
import type { Comment } from './db';

export async function seedDefaultCategories() {
  if (!isClient || !db) return;
  const count = await db.categories.count();
  if (count > 0) return;
  const now = new Date();
  const names = ['Hobbies', 'Projects', 'Books', 'Thoughts'];
  await db.categories.bulkAdd(
    names.map(name => ({ name, createdAt: now, updatedAt: now }) as Category)
  );
}

export async function listCategories() {
  if (!isClient || !db) return [] as Category[];
  return db.categories.orderBy('createdAt').toArray();
}

export type StackSortKey = 'created' | 'updated' | 'title';
export async function listStacksByCategory(categoryId: number, sort: StackSortKey) {
  if (!isClient || !db) return [] as Notestack[];
  const stacks = await db.notestacks.where({ categoryId }).toArray();
  return stacks.sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'updated') return b.updatedAt.getTime() - a.updatedAt.getTime();
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export async function createStackWithTitleCard(categoryId: number, title: string) {
  if (!isClient || !db) throw new Error('DB is client-only');
  const now = new Date();
  const stackId = await db.notestacks.add({
    title, categoryId, createdAt: now, updatedAt: now
  } as Notestack);

  const titleNoteId = await db.notes.add({
    content: `# ${title}\n\n*(title card)*`,
    createdAt: now,
    updatedAt: now
  } as Note);

  await db.noteToStack.add({
    noteId: titleNoteId,
    stackId,
    isTitleCard: true
  } as NoteToStack);

  return stackId;
}

export type NoteSortKey = 'created' | 'updated' | 'title';
export async function listNotesForStack(stackId: number, sort: NoteSortKey) {
  if (!isClient || !db) return [] as { note: Note; isTitleCard: boolean }[];

  const mappings = await db.noteToStack.where({ stackId }).toArray();
  const notes = (await db.notes.bulkGet(mappings.map(m => m.noteId))).map((n, i) => ({
    note: n!,
    isTitleCard: mappings[i].isTitleCard
  })).filter(x => !!x.note);

  return notes.sort((a, b) => {
    if (sort === 'title') {
      const at = extractTitle(a.note.content);
      const bt = extractTitle(b.note.content);
      return at.localeCompare(bt);
    }
    if (sort === 'updated') return b.note.updatedAt.getTime() - a.note.updatedAt.getTime();
    return a.note.createdAt.getTime() - b.note.createdAt.getTime(); // created old -> new (title card first)
  });
}

export function extractTitle(markdown: string): string {
  const line = (markdown.split('\n').find(l => l.trim().length > 0) || '').trim();
  return line.replace(/^#+\s*/, '') || '(untitled)';
}

export async function createNoteInStack(stackId: number) {
  if (!isClient || !db) throw new Error('DB is client-only');
  const now = new Date();
  const noteId = await db!.notes.add({
    content: '',
    createdAt: now,
    updatedAt: now
  } as Note);
  await db!.noteToStack.add({ noteId, stackId, isTitleCard: false });
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

/* ---------------- Comments API ---------------- */

const CURRENT_USER = 'me'; // stub until auth
export function currentUser() { return CURRENT_USER; }

export async function addComment(
  noteId: number,
  parentId: number | null,
  text: string,
  author = CURRENT_USER
) {
  if (!isClient || !db) return;
  const now = new Date();
  await db.comments.add({
    noteId,
    parentId,
    author,
    text,
    createdAt: now,
    isPrimaryChild: false,
    archived: false,
    archivedAt: null,
  } as Comment);
}

export async function listComments(noteId: number, parentId: number | null, archived = false) {
  if (!isClient || !db) return [] as Comment[];
  return db.comments
    .where('noteId')
    .equals(noteId)
    .and(c => c.parentId === parentId && c.archived === archived)
    .sortBy('createdAt'); // oldest -> newest
}

export async function listArchivedTopLevel(noteId: number) {
  return listComments(noteId, null, true);
}

export async function listArchivedChildren(parentId: number) {
  if (!isClient || !db) return [] as Comment[];
  const parent = await db.comments.get(parentId);
  if (!parent) return [];
  return listComments(parent.noteId, parentId, true);
}

export async function getCommentById(id: number) {
  if (!isClient || !db) return null;
  return db.comments.get(id);
}

export async function getPrimaryChild(parentId: number) {
  if (!isClient || !db) return null;
  return db.comments.where('parentId').equals(parentId).filter(c => c.isPrimaryChild).first();
}

export async function setPrimaryChild(parentId: number, childId: number) {
  if (!isClient || !db) return;
  await db.transaction('rw', db.comments, async () => {
    const siblings = await db.comments.where('parentId').equals(parentId).toArray();
    await Promise.all(
      siblings.map((s) =>
        db.comments.update(s.id!, { isPrimaryChild: s.id === childId })
      )
    );
  });
}

export async function computePrimaryThreadFrom(commentId: number) {
  if (!isClient || !db) return [] as Comment[];
  const path: Comment[] = [];
  let current = await db.comments.get(commentId);
  while (current) {
    path.push(current);
    const pc = await getPrimaryChild(current.id!);
    if (!pc) break;
    current = pc;
  }
  return path;
}

// ARCHIVE (cascade)
export async function archiveCommentCascade(rootId: number) {
  if (!isClient || !db) return;
  const now = new Date();
  await db.transaction('rw', db.comments, async () => {
    const queue: number[] = [rootId];
    const toUpdate: number[] = [];
    while (queue.length) {
      const id = queue.shift()!;
      const c = await db.comments.get(id);
      if (!c) continue;
      toUpdate.push(id);
      const kids = await db.comments.where('parentId').equals(id).toArray();
      for (const k of kids) if (k.id != null) queue.push(k.id);
    }
    await Promise.all(
      toUpdate.map(id => db.comments.update(id, { archived: true, archivedAt: now }))
    );
  });
}
