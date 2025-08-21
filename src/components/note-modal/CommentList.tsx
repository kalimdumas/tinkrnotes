import { For, createResource } from 'solid-js';
import type { Comment } from '../../lib/db';
import { addComment, listComments, currentUser } from '../../lib/data';
import { CommentComposer } from '../comments/CommentComposer';
import { CommentNode } from './CommentNodeList';

export function CommentList(props: {
  noteId: number;
  parentId: number | null;
  onFocus: (id: number) => void;
}) {
  const [items, { mutate }] = createResource(
    () => [props.noteId, props.parentId] as const,
    async () => listComments(props.noteId, props.parentId)
  );

  async function addTopLevel(text: string) {
    const temp: Comment = { id: -Date.now(), noteId: props.noteId, parentId: null, author: currentUser(), text, createdAt: new Date(), isPrimaryChild: false, archived: false, archivedAt: null };
    mutate(p => ([...(p || []), temp]));
    const saved = await addComment(props.noteId, null, text);
    if (saved) mutate(p => (p || []).map(c => c.id === temp.id ? saved : c)); else mutate(p => (p || []).filter(c => c.id !== temp.id));
  }

  return (
    <div>
      <CommentComposer placeholder="Add a top-level comment…" onSubmit={addTopLevel} />
      <div class="space-y-3 mt-2">
        <For each={(items() as Comment[]) || []}>
          {(c) => (
            <CommentNode
              comment={c}
              parentAuthor={null}
              showFocusButton
              onFocus={() => props.onFocus(c.id!)}
              onShowPrimaryThread={() => {}}
            />
          )}
        </For>
      </div>
    </div>
  );
}
