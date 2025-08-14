import { For, Show, createResource, createSignal } from 'solid-js';
import type { Notestack as NotestackModel, Note as NoteModel } from '../lib/db';
import type { NoteSortKey } from './AllStacksBoard';
import { createNoteInStack, listNotesForStack } from '../lib/data';
import { Note } from './Note';

type NoteRow = { note: NoteModel; isTitleCard: boolean };

export function Notestack(props: {
  stack: NotestackModel;
  noteSort: NoteSortKey;
  onOpenNote: (noteId: number) => void;
}) {
  const [expanded, setExpanded] = createSignal(false);

  const [notes, { refetch }] = createResource(
    () => (expanded() ? [props.stack.id, props.noteSort] : null) as any,
    async () => listNotesForStack(props.stack.id!, props.noteSort)
  );

  async function toggleExpand() {
    const next = !expanded();
    setExpanded(next);
    if (next) await refetch();
  }

  async function addNote() {
    const id = await createNoteInStack(props.stack.id!);
    if (!expanded()) setExpanded(true);
    await refetch();
    props.onOpenNote(id);
  }

  return (
    <div
      class="border rounded bg-white shadow-sm"
      style="border:1px solid #d1d5db; border-radius:8px; background:#ffffff; overflow:hidden;"  // ⬅ NEW: overflow hidden
    >
      <div class="p-3 flex items-start justify-between">
        <div class="min-w-0">
          <div class="font-medium truncate">{props.stack.title}</div>
          <div class="text-xs text-gray-500 mt-0.5">
            Created {props.stack.createdAt.toLocaleDateString()} • Updated {props.stack.updatedAt.toLocaleDateString()}
          </div>
        </div>
        <button class="text-sm underline ml-2" onClick={toggleExpand}>
          {expanded() ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <Show when={expanded()}>
        <div class="border-t p-2" style="border-top:1px solid #e5e7eb;">
          <div class="flex items-center gap-2 mb-2">
            <div class="font-semibold text-sm">Notes</div>
            <button class="px-2 py-0.5 border rounded text-sm" onClick={addNote}>
              + New note
            </button>
          </div>
          <ul class="space-y-1">
            <For each={(notes() as NoteRow[]) || []}>
              {(row) => <Note row={row} onOpenNote={props.onOpenNote} />}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  );
}
