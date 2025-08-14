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

  return (
    <Show when={note()}>
      {/* Backdrop */}
      <div
        style="position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:50;"
        onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
      >
        {/* Modal */}
        <div style="width:min(760px,96vw); max-height:90vh; background:#fff; border:1px solid #ddd; border-radius:10px; overflow:hidden; display:flex; flex-direction:column;">
          <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid #eee;">
            <div style="font-weight:600;">Edit Note & Comments</div>
            <button class="px-2 py-1 border rounded" onClick={props.onClose}>Close</button>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0; min-height:360px;">
            <NoteEditor value={content()} onChange={save} />
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
    </Show>
  );
}
