import { Show, createResource, createSignal } from 'solid-js';
import type { Comment } from '../../lib/db';
import {
  addComment,
  currentUser,
  getCommentById,
} from '../../lib/data';
import { CommentNodeList } from './CommentNodeList';

export function FocusedThread(props: {
  rootId: number;
  onBack: () => void;
  onShowPrimaryThread: (childId: number) => void;
}) {
  const [root] = createResource(
    () => props.rootId,
    async (id) => getCommentById(id)
  );

  const [reply, setReply] = createSignal('');
  async function addReply() {
    const t = reply().trim();
    const r = root();
    if (!t || !r) return;
    await addComment(r.noteId, r.id!, t);
    setReply('');
  }

  return (
    <Show when={root()}>
      <div class="mb-2">
        <button class="px-2 py-1 border rounded text-sm" onClick={props.onBack}>
          Back to all top-level comments
        </button>
      </div>

      <div class="border rounded p-2 bg-white">
        <div class="text-sm">
          <span class="font-semibold">{root()!.author}</span>{' '}
          <span class="text-gray-500 text-xs">{root()!.createdAt.toLocaleString()}</span>
        </div>
        <div class="mt-1">{root()!.text}</div>

        {/* Reply to the focused root */}
        <div class="mt-2">
          <textarea
            class="w-full border rounded p-2 resize-none"
            rows={2}
            placeholder="Reply to this thread…"
            value={reply()}
            onInput={(e) => setReply(e.currentTarget.value)}
          />
          <div class="mt-1 flex gap-2">
            <button class="px-2 py-1 border rounded text-sm" onClick={addReply}>Post reply</button>
          </div>
        </div>

        {/* Children (recursive), with primary-thread button only on first layer */}
        <div class="mt-3">
          <div class="font-semibold text-sm mb-1">Replies</div>
          <CommentNodeList
            parent={root() as Comment}
            allowShowPrimaryForChildren={true}
            onShowPrimaryThread={props.onShowPrimaryThread}
          />
        </div>
      </div>
    </Show>
  );
}
