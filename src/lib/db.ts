import Dexie, { Table } from 'dexie';

export interface Category {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface Stack {
  id?: number;
  uid: string;             // global id for sync
  title: string;
  categoryId: number;      // local link to Category
  createdAt: Date;
  updatedAt: Date;
}
export interface Note {
  id?: number;
  uid: string;             // global id for sync
  stackId: number;         // local link to Stack
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface Comment {
  id?: number;
  uid: string;             // global id for sync
  noteId: number;          // local link to Note
  parentId: number | null; // local link to Comment (if reply)
  author: string;
  text: string;
  createdAt: Date;
}

export const isClient =
  typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

class AppDB extends Dexie {
  categories!: Table<Category, number>;
  stacks!: Table<Stack, number>;
  notes!: Table<Note, number>;
  comments!: Table<Comment, number>;

  constructor() {
    super('tinkrnotes_v3'); // bump to v3 to reset
    this.version(1).stores({
      categories: '++id, name, createdAt, updatedAt',
      stacks:     '++id, uid, title, categoryId, createdAt, updatedAt',
      notes:      '++id, uid, stackId, createdAt, updatedAt',
      comments:   '++id, uid, noteId, parentId, createdAt'
    });
  }
}

export const db: AppDB | null = isClient ? new AppDB() : null;
