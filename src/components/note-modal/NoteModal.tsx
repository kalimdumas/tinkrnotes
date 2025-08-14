import { Show, createEffect, createSignal } from 'solid-js';
import type { Note as NoteModel, Comment as CommentModel } from '../../lib/db';
import { getNote, updateNote } from '../../lib/data';
import { NoteEditor } from './NoteEditor';
import { CommentsPanel } from './CommentsPanel';

export function NoteModal(props: { noteId: number | null; onClose(): void }) {
  const [note, setNote] = createSignal<NoteModel | null>(null);
  const [content, setContent] = createSignal('');
  const [focusedId, setFocusedId] = createSignal<number | null>(null);
  const [primaryPreview, setPrimaryPreview] = createSignal<CommentModel[] | null>(null);

  // Load note whenever it changes
  createEffect(async () => {
    setPrimaryPreview(null);
    setFocusedId(null);
    if (props.noteId == null) { setNote(null); setContent(''); return; }
    const n = await getNote(props.noteId);
    if (n) { setNote(n); setContent(n.content); }
  });

  async function save(val: string) {
    setContent(val);
    if (note()?.id) await updateNote(note()!.id!, val);
  }

  // Close logic: only if BOTH down & up happen outside the modal
  let modalRef!: HTMLDivElement;
  let outsideDown = false;
  function onBackdropMouseDown(e: MouseEvent) {
    outsideDown = modalRef ? !modalRef.contains(e.target as Node) : true;
  }
  function onBackdropMouseUp(e: MouseEvent) {
    const outsideUp = modalRef ? !modalRef.contains(e.target as Node) : true;
    if (outsideDown && outsideUp) props.onClose();
    outsideDown = false;
  }

  return (
    <Show when={note()}>
      {/* Backdrop */}
      <div
        style="position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:50;"
        onMouseDown={onBackdropMouseDown}
        onMouseUp={onBackdropMouseUp}
      >
        {/* Modal (bigger, thicker border) */}
        <div
          ref={modalRef}
          style="
            width:min(1100px,98vw);
            max-height:95vh;
            background:#fff;
            border:2px solid #cfcfcf;
            border-radius:12px;
            overflow:hidden;
            display:flex;
            flex-direction:column;
          "
        >
          <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #e6e6e6;">
            <div style="font-weight:600;">Edit Note & Comments</div>
            <button class="px-2 py-1 border rounded" onClick={props.onClose}>Close</button>
          </div>

          {/* Vertical stack: 30% editor (top), 70% comments (bottom) */}
          <div style="display:flex; flex-direction:column; height:calc(95vh - 54px); min-height:420px;">
            <NoteEditor value={content()} onChange={save} basis="30%" />
            <div style="flex:1 1 70%; min-height:0;">
              <CommentsPanel
                noteId={note()!.id!}
                focusedId={focusedId()}
                onFocusChange={setFocusedId}
                primaryPreview={primaryPreview()}
                onSetPrimaryPreview={setPrimaryPreview}
              />
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
