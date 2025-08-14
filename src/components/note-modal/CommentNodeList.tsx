import { For, Show, createResource, createSignal } from 'solid-js';
import type { Comment } from '../../lib/db';
import {
  addComment,
  archiveCommentCascade,
  currentUser,
  listArchivedChildren,
  listComments,
  setPrimaryChild,
} from '../../lib/data';
import { ArchivedList } from './ArchivedList';

export function CommentNodeList(props: {
  parent: Comment;
  allowShowPrimaryForChildren: boolean;
  onShowPrimaryThread: (childId: number) => void;
}) {
  const [children, { refetch }] = createResource(
    () => props.parent.id,
    async (id) => listComments(props.parent.noteId, id!, false)
  );

  async function replyTo(parentId: number, text: string) {
    if (!text.trim()) return;
    await addComment(props.parent.noteId, parentId, text.trim());
    await refetch();
  }

  async function archive(id: number, author: string) {
    if (author !== currentUser()) return;
    if (!confirm('Archive this subthread (comment and its replies)?')) return;
    await archiveCommentCascade(id);
    await refetch();
  }

  async function setPrimary(childId: number) {
    // Only the parent author can set its primary child
    if (props.parent.author !== currentUser()) return;
    await setPrimaryChild(props.parent.id!, childId);
    await refetch();
  }

  return (
    <div class="mt-2">
      <ul class="space-y-2">
        <For each={(children() as Comment[]) || []}>
          {(child) => <CommentLeaf
            comment={child}
            parentAuthor={props.parent.author}
            allowShowPrimary={props.allowShowPrimaryForChildren}
            onShowPrimaryThread={() => props.onShowPrimaryThread(child.id!)}
            onReply={(text) => replyTo(child.id!, text)}
            onArchive={() => archive(child.id!, child.author)}
            onSetPrimary={() => setPrimary(child.id!)}
          />}
        </For>
      </ul>

      {/* Archived subthreads section for this parent */}
      <ArchivedList
        label="Archived subthreads"
        load={async () => listArchivedChildren(props.parent.id!)}
      />
    </div>
  );
}

function CommentLeaf(props: {
  comment: Comment;
  parentAuthor: string;
  allowShowPrimary: boolean;
  onShowPrimaryThread: () => void;
  onReply: (text: string) => void;
  onArchive: () => void;
  onSetPrimary: () => void;
}) {
  const [replyOpen, setReplyOpen] = createSignal(false);
  const [replyText, setReplyText] = createSignal('');

  async function postReply() {
    await props.onReply(replyText());
    setReplyText('');
    setReplyOpen(false);
  }

  const canSetPrimary = props.parentAuthor === currentUser();
  const isOwner = props.comment.author === currentUser();

  return (
    <li class="border rounded p-2 bg-gray-50">
      <div class="text-sm flex items-start justify-between gap-2">
        <div>
          <span class="font-semibold">{props.comment.author}</span>{' '}
          <span class="text-gray-500 text-xs">{props.comment.createdAt.toLocaleString()}</span>
          <div class="mt-1">{props.comment.text}</div>
        </div>
        <div class="flex flex-col gap-1">
          {props.allowShowPrimary && (
            <button class="px-2 py-0.5 border rounded text-xs" onClick={props.onShowPrimaryThread}>
              Show primary thread
            </button>
          )}
          {canSetPrimary && (
            <button class="px-2 py-0.5 border rounded text-xs" onClick={props.onSetPrimary}>
              Set as primary
            </button>
          )}
          {isOwner && (
            <button class="px-2 py-0.5 border rounded text-xs" onClick={props.onArchive}>
              Archive
            </button>
          )}
          <button class="px-2 py-0.5 border rounded text-xs" onClick={() => setReplyOpen(!replyOpen())}>
            {replyOpen() ? 'Cancel' : 'Reply'}
          </button>
        </div>
      </div>

      {/* Reply box */}
      <Show when={replyOpen()}>
        <div class="mt-2">
          <textarea
            class="w-full border rounded p-2 resize-none"
            rows={2}
            placeholder="Write a reply…"
            value={replyText()}
            onInput={(e) => setReplyText(e.currentTarget.value)}
          />
          <div class="mt-1 flex gap-2">
            <button class="px-2 py-1 border rounded text-sm" onClick={postReply}>Post reply</button>
          </div>
        </div>
      </Show>

      {/* Recursively render this comment's children */}
      <CommentNodeList
        parent={props.comment}
        allowShowPrimaryForChildren={false}
        onShowPrimaryThread={props.onShowPrimaryThread /* not shown deeper */}
      />
    </li>
  );
}
