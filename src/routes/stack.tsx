import { For, Show, createResource, createSignal } from 'solid-js';
import { getStack, listNotes, createNote, titleOf } from '../lib/data';
import type { Note, Stack } from '../lib/db';
import { NotePreview } from '../components/NotePreview';
import { Link, navigate } from '../lib/router';

export default function StackPage(props: { params: { id: string } }) {
  const id = () => Number(props.params.id);
  const [stack] = createResource(() => id(), getStack);
  const [sort, setSort] = createSignal<'updated'|'created'|'title'>('updated');
  const [q, setQ] = createSignal('');
  const [notes, { mutate }] = createResource(
    () => [id(), sort()] as const,
    ([sid, s]) => listNotes(sid, s)
  );

  async function addNoteClick() {
    const now = new Date();
    const tmp: Note = { id: -Date.now(), stackId: id(), content: '', createdAt: now, updatedAt: now };
    mutate(prev => ([tmp, ...(prev||[])])); // optimistic
    const realId = await createNote(id());
    mutate(prev => (prev||[]).map(n => n.id===tmp.id ? { ...tmp, id: realId } : n));
    navigate(`/note/${realId}`);
  }

  function matches(n: Note) {
    const s = q().trim().toLowerCase();
    const full = (titleOf(n.content) + ' ' + n.content).toLowerCase();
    return !s || full.includes(s);
  }

  return (
    <section style="max-width:900px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:12px">
      <div class="row">
        <Link class="btn" href="/">← Back</Link>
        <div style="font-weight:600">{stack()?.title || 'Stack'}</div>
        <span style="margin-left:auto"></span>
        <input class="input" style="max-width:280px" placeholder="Search notes…" onInput={e=>setQ(e.currentTarget.value)} />
        <select class="input" style="max-width:180px" value={sort()} onInput={e=>setSort(e.currentTarget.value as any)}>
          <option value="updated">Updated</option>
          <option value="created">Created</option>
          <option value="title">Title</option>
        </select>
        <button class="btn" onClick={addNoteClick}>+ New note</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
        <For each={((notes() as Note[]) || []).filter(matches)}>
          {n => <NotePreview note={n} onOpen={()=>navigate(`/note/${n.id}`)} />}
        </For>
        <Show when={(notes() as Note[]|undefined)?.length===0}>
          <div style="color:var(--muted)">No notes yet.</div>
        </Show>
      </div>
    </section>
  );
}
