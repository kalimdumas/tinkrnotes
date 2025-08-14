import Dexie, { Table } from 'dexie';

export const isClient =
  typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

export interface Category {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface Notestack {
  id?: number;
  title: string;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface Note {
  id?: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface NoteToStack {
  id?: number;
  noteId: number;
  stackId: number;
  isTitleCard: boolean;
}
export interface Comment {
  id?: number;
  noteId: number;
  parentId: number | null;
  author: string;
  text: string;
  createdAt: Date;
  isPrimaryChild: boolean;
  archived: boolean;          // NEW
  archivedAt?: Date | null;   // NEW
}

class AppDB extends Dexie {
  categories!: Table<Category, number>;
  notestacks!: Table<Notestack, number>;
  notes!: Table<Note, number>;
  noteToStack!: Table<NoteToStack, number>;
  comments!: Table<Comment, number>;

  constructor() {
    super('tinkrnotesDB');

    // v2 existed already; v3 adds archived fields and index on archived
    this.version(3).stores({
      categories: '++id, name, createdAt, updatedAt',
      notestacks: '++id, title, categoryId, createdAt, updatedAt',
      notes: '++id, createdAt, updatedAt',
      noteToStack: '++id, noteId, stackId, isTitleCard',
      comments: '++id, noteId, parentId, createdAt, isPrimaryChild, archived',
    }).upgrade(async (tx) => {
      const tbl = tx.table('comments');
      await tbl.toCollection().modify((r: any) => {
        if (typeof r.archived === 'undefined') r.archived = false;
        if (typeof r.archivedAt === 'undefined') r.archivedAt = null;
      });
    });
  }
}

export const db: AppDB | null = isClient ? new AppDB() : null;
