import { Show, createEffect, createSignal } from 'solid-js';
import type { Note as NoteModel, Comment as CommentModel } from '../../lib/db';
import { getNote, updateNote } from '../../lib/data';
import { NoteEditor } from './NoteEditor';
import { CommentsPanel } from './CommentsPanel';
import { Modal } from '../Modal';

export function NoteModal(props: { noteId: number | null; onClose(): void }) {
  const [note, setNote] = createSignal<NoteModel | null>(null);
  const [content, setContent] = createSignal('');
  const [focusedId, setFocusedId] = createSignal<number | null>(null);
  const [primaryPreview, setPrimaryPreview] = createSignal<CommentModel[] | null>(null);

  createEffect(async () => {
    setPrimaryPreview(null); setFocusedId(null);
    if (props.noteId == null) { setNote(null); setContent(''); return; }
    const n = await getNote(props.noteId); if (n) { setNote(n); setContent(n.content); }
  });

  async function save(val: string) {
    setContent(val);
    if (note()?.id) await updateNote(note()!.id!, val);
  }

  return (
    <Modal open={!!note()} title="Edit Note & Comments" onClose={props.onClose}>
      <Show when={note()}>
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
      </Show>
    </Modal>
  );
}
