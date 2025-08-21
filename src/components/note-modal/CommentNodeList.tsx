import { For, Show, createResource, createSignal } from 'solid-js';
import type { Comment } from '../../lib/db';
import { addComment, currentUser, listComments, setPrimaryChild } from '../../lib/data';
import { CommentCard } from '../comments/CommentCard';
import { CommentComposer } from '../comments/CommentComposer';

export function CommentNodeList(props: {
  parent: Comment;
  allowShowPrimaryForChildren: boolean;
  onShowPrimaryThread: (childId: number) => void;
  showReplyBoxForParent?: boolean;
  onFocus?: (id: number) => void;
}) {
  const [children, { mutate }] = createResource(
    () => props.parent.id,
    async (id) => listComments(props.parent.noteId, id!, false as any) // compat
  );

  async function replyToParent(text: string) {
    const temp: Comment = { id: -Date.now(), noteId: props.parent.noteId, parentId: props.parent.id!, author: currentUser(), text, createdAt: new Date(), isPrimaryChild: false, archived: false, archivedAt: null };
    mutate(p => ([...(p || []), temp]));
    const saved = await addComment(props.parent.noteId, props.parent.id!, text);
    if (saved) mutate(p => (p || []).map(c => c.id === temp.id ? saved : c)); else mutate(p => (p || []).filter(c => c.id !== temp.id));
  }

  async function setPrimary(childId: number) {
    if (props.parent.author !== currentUser()) return;
    await setPrimaryChild(props.parent.id!, childId);
  }

  return (
    <div class="mt-2">
      <Show when={props.showReplyBoxForParent}>
        <CommentComposer placeholder="Reply…" compact onSubmit={replyToParent} />
      </Show>
      <div class="space-y-2">
        <For each={(children() as Comment[]) || []}>
          {(child) => (
            <CommentNode
              comment={child}
              parentAuthor={props.parent.author}
              showFocusButton={!!props.onFocus}
              onFocus={() => props.onFocus?.(child.id!)}
              showPrimaryButton={props.allowShowPrimaryForChildren}
              onShowPrimaryThread={() => props.onShowPrimaryThread(child.id!)}
              onSetPrimary={() => setPrimary(child.id!)}
            />
          )}
        </For>
      </div>
    </div>
  );
}

export function CommentNode(props: {
  comment: Comment;
  parentAuthor: string | null;
  showFocusButton?: boolean;
  onFocus?: () => void;
  showPrimaryButton?: boolean;
  onShowPrimaryThread?: () => void;
  onSetPrimary?: () => void;
}) {
  const [replyOpen, setReplyOpen] = createSignal(false);
  const isOwner = props.comment.author === currentUser();
  const canSetPrimary = !!props.parentAuthor && props.parentAuthor === currentUser();

  return (
    <div class="space-y-2">
      <CommentCard
        author={props.comment.author}
        createdAt={props.comment.createdAt}
        text={props.comment.text}
        showPrimaryButton={!!props.showPrimaryButton}
        canSetPrimary={canSetPrimary}
        isOwner={isOwner /* owner-only actions, but no archive now */}
        onShowPrimaryThread={props.onShowPrimaryThread}
        onSetPrimary={props.onSetPrimary}
        onToggleReply={() => setReplyOpen(!replyOpen())}
        replyOpen={replyOpen()}
        rightActions={props.showFocusButton && props.onFocus ? (<button class="btn-ghost" onClick={props.onFocus}>Focus</button>) : undefined}
      />
      <CommentNodeList
        parent={props.comment}
        allowShowPrimaryForChildren={false}
        onShowPrimaryThread={() => {}}
        showReplyBoxForParent={replyOpen()}
      />
    </div>
  );
}
