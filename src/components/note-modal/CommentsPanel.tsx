import { Show } from 'solid-js';
import type { Comment as CommentModel } from '../../lib/db';
import { computePrimaryThreadFrom } from '../../lib/data';
import { CommentList } from './CommentList';
import { FocusedThread } from './FocusedThread';
import { PrimaryThreadPreview } from './PrimaryThreadPreview';

export function CommentsPanel(props: {
  noteId: number;
  focusedId: number | null;
  onFocusChange: (id: number | null) => void;
  primaryPreview: CommentModel[] | null;
  onSetPrimaryPreview: (list: CommentModel[] | null) => void;
}) {
  async function handleShowPrimaryThread(childId: number) {
    const path = await computePrimaryThreadFrom(childId);
    props.onSetPrimaryPreview(path);
  }

  return (
    <div style="display:flex; flex-direction:column; min-height:0;">
      <div class="p-2" style="border-bottom:1px solid #eee; display:flex; gap:8px; align-items:center;">
        <div class="font-semibold">Comments</div>
        <Show when={props.focusedId !== null}>
          <button
            class="px-2 py-1 border rounded text-sm"
            onClick={() => { props.onFocusChange(null); props.onSetPrimaryPreview(null); }}
          >
            Show primary (top-level) thread list
          </button>
        </Show>
      </div>

      <div style="flex:1; overflow:auto; padding:8px 10px;">
        <Show
          when={props.focusedId === null}
          fallback={
            <FocusedThread
              rootId={props.focusedId!}
              onBack={() => { props.onFocusChange(null); props.onSetPrimaryPreview(null); }}
              onShowPrimaryThread={handleShowPrimaryThread}
            />
          }
        >
          <CommentList
            noteId={props.noteId}
            parentId={null}
            onFocus={(id) => { props.onFocusChange(id); props.onSetPrimaryPreview(null); }}
          />
        </Show>

        <PrimaryThreadPreview list={props.primaryPreview} />
      </div>
    </div>
  );
}
