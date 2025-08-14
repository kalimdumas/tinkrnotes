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
  showReplyBoxForParent?: boolean; // NEW: show reply box for the parent itself (used for focused root)
}) {
  const [children, { refetch, mutate }] = createResource(
    () => props.parent.id,
    async (id) => listComments(props.parent.noteId, id!, false)
  );

  // Optional reply box for the parent
  const [parentReplyOpen, setParentReplyOpen] = createSignal(!!props.showReplyBoxForParent);
  const [parentReplyText, setParentReplyText] = createSignal('');

  async function replyToParent() {
    const text = parentReplyText().trim();
    if (!text) return;

    // optimistic child
    const temp: Comment = {
      id: -Date.now(),
      noteId: props.parent.noteId,
      parentId: props.parent.id!,
      author: currentUser(),
      text,
      createdAt: new Date(),
      isPrimaryChild: false,
      archived: false,
      archivedAt: null,
    };
    mutate((prev) => ([...(prev || []), temp]));
    setParentReplyText('');
    if (!props.showReplyBoxForParent) setParentReplyOpen(false);

    const saved = await addComment(props.parent.noteId, props.parent.id!, text);
    if (saved) {
      mutate((prev) => (prev || []).map(c => c.id === temp.id ? saved : c));
    } else {
      mutate((prev) => (prev || []).filter(c => c.id !== temp.id));
    }
  }

  async function replyTo(childId: number, text: string) {
    if (!text.trim()) return;

    const temp: Comment = {
      id: -Date.now(),
      noteId: props.parent.noteId,
      parentId: childId,
      author: currentUser(),
      text: text.trim(),
      createdAt: new Date(),
      isPrimaryChild: false,
      archived: false,
      archivedAt: null,
    };
    mutate((prev) => ([...(prev || []), temp])); // will be reordered on next load, but shows instantly

    const saved = await addComment(props.parent.noteId, childId, text.trim());
    if (saved) {
      mutate((prev) => (prev || []).map(c => c.id === temp.id ? saved : c));
    } else {
      mutate((prev) => (prev || []).filter(c => c.id !== temp.id));
    }
  }

  async function archive(id: number, author: string) {
    if (author !== currentUser()) return;
    if (!confirm('Archive this subthread (comment and its replies)?')) return;

    // Optimistic remove from current list (and implicitly its descendants from UI)
    mutate((prev) => (prev || []).filter(c => c.id !== id));

    await archiveCommentCascade(id);
  }

  async function setPrimary(childId: number) {
    if (props.parent.author !== currentUser()) return;
    await setPrimaryChild(props.parent.id!, childId);
    // No visual change needed immediately unless you’re previewing the primary path; leave as-is
  }

  return (
    <div class="mt-2">
      {/* Optional reply to the parent comment (used for focused root) */}
      <Show when={props.showReplyBoxForParent}>
        <div class="mb-2">
          <textarea
            class="w-full border rounded p-2 resize-none"
            rows={2}
            placeholder="Reply…"
            value={parentReplyText()}
            onInput={(e) => setParentReplyText(e.currentTarget.value)}
          />
          <div class="mt-1 flex gap-2">
            <button class="px-2 py-1 border rounded text-sm" onClick={replyToParent}>Post reply</button>
          </div>
        </div>
      </Show>

      <ul class="space-y-2">
        <For each={(children() as Comment[]) || []}>
          {(child) => (
            <CommentLeaf
              comment={child}
              parentAuthor={props.parent.author}
              allowShowPrimary={props.allowShowPrimaryForChildren}
              onShowPrimaryThread={() => props.onShowPrimaryThread(child.id!)}
              onReply={(txt) => replyTo(child.id!, txt)}
              onArchive={() => archive(child.id!, child.author)}
              onSetPrimary={() => setPrimary(child.id!)}
            />
          )}
        </For>
      </ul>

      {/* Archived subthreads for this parent */}
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

      {/* Recurse */}
      <CommentNodeList
        parent={props.comment}
        allowShowPrimaryForChildren={false}
        onShowPrimaryThread={props.onShowPrimaryThread}
      />
    </li>
  );
}
