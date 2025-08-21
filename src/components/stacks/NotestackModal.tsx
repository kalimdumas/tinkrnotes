import { For, Show, createResource } from 'solid-js';
import type { Notestack } from '../../lib/db';
import { listNotePreviews, extractTitle } from '../../lib/data';
import { Modal } from '../Modal';
import { NotePreviewCard } from './NotePreviewCard';

export function NotestackModal(props: {
  open: boolean;
  stack: Notestack | null;
  onClose: () => void;
  onOpenNote: (id: number) => void;
}) {
  const [previews, { refetch }] = createResource(
    () => (props.open && props.stack?.id) || null,
    async () => listNotePreviews(props.stack!.id!)
  );

  return (
    <Modal open={props.open} title={props.stack?.title || 'Notestack'} onClose={props.onClose}>
      <div style="display:flex; flex-direction:column; min-height:60vh;">
        <div class="p-3 text-sm text-gray-600">Notes in this stack</div>
        <div class="p-3 pt-0 space-y-3 overflow-auto">
          <For each={(previews() as any[]) || []}>
            {(row) => (
              <NotePreviewCard
                title={extractTitle(row.note.content)}
                content={row.note.content}
                updatedAt={row.note.updatedAt}
                topCommentText={row.topComment?.text || null}
                onOpen={() => props.onOpenNote(row.note.id!)}
              />
            )}
          </For>
          <Show when={!previews() || (previews() as any[]).length === 0}>
            <div class="text-sm text-gray-500">No notes yet.</div>
          </Show>
        </div>
      </div>
    </Modal>
  );
}
