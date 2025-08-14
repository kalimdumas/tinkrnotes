import { For, createResource, createSignal, onMount } from 'solid-js';
import { listCategories } from '../lib/data';
import type { Category as CategoryModel } from '../lib/db';
import { Category as CategoryComponent } from './Category';

export type StackSortKey = 'created' | 'updated' | 'title';
export type NoteSortKey  = 'created' | 'updated' | 'title';

export function AllStacksBoard(props: { onOpenNote: (noteId: number) => void }) {
  const [stackSort, setStackSort] = createSignal<StackSortKey>('created');
  const [noteSort,  setNoteSort]  = createSignal<NoteSortKey>('updated');

  const [categories, { refetch }] = createResource(listCategories);

  onMount(async () => {
    const mod = await import('../lib/data'); // seed only on client
    await mod.seedDefaultCategories();
    await refetch();
  });

  return (
    <section class="flex-1 p-4 overflow-auto">
      <div class="mb-3 flex items-center gap-4">
        <div class="text-xl font-semibold">All Notestacks</div>
        <div class="ml-auto flex items-center gap-3">
          <label class="text-sm">Sort stacks</label>
          <select
            class="border rounded px-2 py-1"
            value={stackSort()}
            onInput={(e) => setStackSort(e.currentTarget.value as StackSortKey)}
          >
            <option value="created">Created (new → old)</option>
            <option value="updated">Last edited</option>
            <option value="title">Title (A→Z)</option>
          </select>

          <label class="text-sm ml-4">Sort notes</label>
          <select
            class="border rounded px-2 py-1"
            value={noteSort()}
            onInput={(e) => setNoteSort(e.currentTarget.value as NoteSortKey)}
          >
            <option value="updated">Last edited</option>
            <option value="created">Created (new → old)</option>
            <option value="title">Title (A→Z)</option>
          </select>
        </div>
      </div>

      {/* columns side-by-side */}
      <div
        class="board"
        style="display:grid; grid-auto-flow:column; grid-auto-columns:20rem; gap:16px; align-items:start; overflow-x:auto; padding:8px 12px 12px;"
      >
        <For each={(categories() as CategoryModel[]) || []}>
          {(cat) => (
            <CategoryComponent
              category={cat}
              stackSort={stackSort()}
              noteSort={noteSort()}
              onOpenNote={props.onOpenNote}
            />
          )}
        </For>
      </div>
    </section>
  );
}
