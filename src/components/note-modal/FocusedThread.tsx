import { Show, createResource } from 'solid-js';
import type { Comment } from '../../lib/db';
import { getCommentById } from '../../lib/data';
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

        {/* Children (recursive), with reply box for the focused parent */}
        <div class="mt-3">
          <div class="font-semibold text-sm mb-1">Replies</div>
          <CommentNodeList
            parent={root() as Comment}
            allowShowPrimaryForChildren={true}
            onShowPrimaryThread={props.onShowPrimaryThread}
            showReplyBoxForParent={true}  // <-- reply here uses optimistic path
          />
        </div>
      </div>
    </Show>
  );
}
