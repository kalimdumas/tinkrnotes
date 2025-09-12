import Dexie, { Table } from 'dexie';

export interface Category { id?: number; name: string; createdAt: Date; updatedAt: Date; }
export interface Stack    { id?: number; title: string; categoryId: number; createdAt: Date; updatedAt: Date; }
export interface Note     { id?: number; stackId: number; content: string; createdAt: Date; updatedAt: Date; }
export interface Comment  { id?: number; noteId: number; parentId: number | null; author: string; text: string; createdAt: Date; }

export const isClient = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

class AppDB extends Dexie {
  categories!: Table<Category, number>;
  stacks!: Table<Stack, number>;
  notes!: Table<Note, number>;
  comments!: Table<Comment, number>;
  constructor() {
    super('tinkrnotes_v2'); // reset DB
    this.version(1).stores({
      categories: '++id, name, createdAt, updatedAt',
      stacks:     '++id, title, categoryId, createdAt, updatedAt',
      notes:      '++id, stackId, createdAt, updatedAt',
      comments:   '++id, noteId, parentId, createdAt'
    });
  }
}
export const db: AppDB | null = isClient ? new AppDB() : null;
