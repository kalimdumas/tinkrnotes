import { createEffect, createSignal, Show } from 'solid-js';
import { getNote, updateNote } from '../lib/data';
import type { Note } from '../lib/db';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function NoteDrawer(props: { noteId: number | null; onClose(): void }) {
  const [note, setNote] = createSignal<Note | null>(null);
  const [content, setContent] = createSignal<string>('');

  createEffect(async () => {
    if (props.noteId == null) { setNote(null); setContent(''); return; }
    const n = await getNote(props.noteId);
    if (n) { setNote(n); setContent(n.content); }
  });

  async function save(val: string) {
    setContent(val);
    if (note()?.id) await updateNote(note()!.id!, val);
  }

  const html = () => {
    const raw = marked.parse(content() || '');
    return DOMPurify.sanitize(raw as string);
  };

  return (
    <Show when={note()}>
      <aside class="w-full md:w-[28rem] border-l bg-white flex flex-col">
        <div class="flex items-center justify-between p-3 border-b">
          <div class="font-semibold">Note</div>
          <button class="px-2 py-1 border rounded" onClick={props.onClose}>Close</button>
        </div>
        <div class="flex-1 grid grid-rows-2">
          <textarea
            class="w-full h-full border-0 p-3 outline-none resize-none"
            placeholder="Note Title"
            value={content()}
            onInput={e => save(e.currentTarget.value)}
          />
          <div class="border-t p-3 overflow-auto prose max-w-none" innerHTML={html()} />
        </div>
      </aside>
    </Show>
  );
}
