import { For, createResource } from 'solid-js';
import type { Category as CategoryModel, Notestack as NotestackModel } from '../lib/db';
import type { StackSortKey, NoteSortKey } from './AllStacksBoard';
import { createStackWithTitleCard, listStacksByCategory } from '../lib/data';
import { Notestack } from './Notestack';

export function Category(props: {
  category: CategoryModel;
  stackSort: StackSortKey;
  noteSort: NoteSortKey;
  onOpenNote: (noteId: number) => void;
}) {
  const [stacks, { refetch }] = createResource(
    () => [props.category.id, props.stackSort] as const,
    async () => listStacksByCategory(props.category.id!, props.stackSort)
  );

  async function addStack() {
    const title = window.prompt('New notestack title?');
    if (!title) return;
    await createStackWithTitleCard(props.category.id!, title);
    await refetch();
  }

  return (
    <div class="column" style="min-width:20rem;">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold">{props.category.name}</h3>
        <button class="text-sm px-2 py-1 border rounded" onClick={addStack}>+ New</button>
      </div>

      <div class="space-y-3">
        <For each={(stacks() as NotestackModel[]) || []}>
          {(stk) => (
            <Notestack
              stack={stk}
              noteSort={props.noteSort}
              onOpenNote={props.onOpenNote}
            />
          )}
        </For>
      </div>
    </div>
  );
}
