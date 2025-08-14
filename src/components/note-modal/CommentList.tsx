import { For, createResource, createSignal, Show } from 'solid-js';
import type { Comment } from '../../lib/db';
import { addComment, listComments, currentUser, archiveCommentCascade, listArchivedTopLevel } from '../../lib/data';
import { ArchivedList } from './ArchivedList';

export function CommentList(props: {
  noteId: number;
  parentId: number | null;    // for this top-level list we pass null
  onFocus: (id: number) => void;
}) {
  const [items, { refetch }] = createResource(
    () => [props.noteId, props.parentId] as const,
    async () => listComments(props.noteId, props.parentId, /* archived */ false)
  );

  const [newText, setNewText] = createSignal('');
  async function add() {
    const t = newText().trim();
    if (!t) return;
    await addComment(props.noteId, props.parentId, t);
    setNewText('');
    await refetch();
  }

  async function archiveThread(id: number, author: string) {
    if (author !== currentUser()) return;
    if (!confirm('Archive this thread and all its subreplies?')) return;
    await archiveCommentCascade(id);
    await refetch();
  }

  return (
    <div>
      {/* New comment input */}
      <div class="mb-2">
        <textarea
          class="w-full border rounded p-2 resize-none"
          rows={2}
          placeholder="Add a top-level comment…"
          value={newText()}
          onInput={(e) => setNewText(e.currentTarget.value)}
        />
        <div class="mt-1 flex gap-2">
          <button class="px-2 py-1 border rounded text-sm" onClick={add}>Post</button>
        </div>
      </div>

      {/* Active threads */}
      <ul class="space-y-2">
        <For each={(items() as Comment[]) || []}>
          {(c) => (
            <li class="border rounded p-2 bg-gray-50">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="text-sm">
                    <span class="font-semibold">{c.author}</span>{' '}
                    <span class="text-gray-500 text-xs">{c.createdAt.toLocaleString()}</span>
                  </div>
                  <div class="mt-1">{c.text}</div>
                </div>
                <div class="flex flex-col gap-1">
                  <button class="px-2 py-0.5 border rounded text-xs" onClick={() => props.onFocus(c.id!)}>
                    Focus
                  </button>
                  <Show when={c.author === currentUser()}>
                    <button class="px-2 py-0.5 border rounded text-xs" onClick={() => archiveThread(c.id!, c.author)}>
                      Archive
                    </button>
                  </Show>
                </div>
              </div>
            </li>
          )}
        </For>
      </ul>

      {/* Archived threads (note-level) */}
      <ArchivedList
        label="Archived threads"
        load={async () => listArchivedTopLevel(props.noteId)}
      />
    </div>
  );
}
