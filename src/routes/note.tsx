import { For, Show, createEffect, createResource, createSignal } from 'solid-js';
import { getNote, updateNote, listTopComments, addComment, deleteCommentCascade, listReplies } from '../lib/data';
import type { Comment, Note } from '../lib/db';
import { Link } from '../lib/router';

export default function NotePage(props: { params: { id: string } }) {
  const noteId = () => Number(props.params.id);

  const [note, { mutate: setNote }] = createResource(() => noteId(), getNote);
  const [content, setContent] = createSignal('');
  createEffect(() => { const n = note(); if (n) setContent(n.content); });

  async function save(val: string) {
    setContent(val); // optimistic
    setNote(n => n ? ({ ...n, content: val, updatedAt: new Date() } as Note) : n);
    await updateNote(noteId(), val);
  }

  const [top, { mutate: setTop }] = createResource(() => noteId(), listTopComments);
  async function addTopLevel(text: string) {
    const tmp: Comment = { id: -Date.now(), noteId: noteId(), parentId: null, author: 'me', text, createdAt: new Date() };
    setTop(prev => ([tmp, ...(prev||[])]));
    const saved = await addComment(noteId(), null, text);
    setTop(prev => (prev||[]).map(c => c.id===tmp.id ? saved : c));
  }
  async function deleteThread(id: number) {
    setTop(prev => (prev||[]).filter(c => c.id !== id)); // optimistic
    await deleteCommentCascade(id);
  }

  return (
    <section style="max-width:900px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:12px">
      <div class="row">
        <Show when={note()}><Link class="btn" href={`/stack/${note()!.stackId}`}>← Back</Link></Show>
        <div style="font-weight:600;margin-left:8px">Note</div>
      </div>

      <textarea class="input" rows={12} placeholder="Write…" value={content()} onInput={e=>save(e.currentTarget.value)} />

      <div style="border-top:1px solid var(--line);padding-top:10px">
        <div style="font-weight:600">Comments</div>
        <Composer onSubmit={addTopLevel} />
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
          <For each={(top() as Comment[]) || []}>
            {c => <Thread comment={c} onDelete={() => deleteThread(c.id!)} />}
          </For>
        </div>
      </div>
    </section>
  );
}

function Composer(props: { onSubmit: (text: string)=>void }) {
  const [text, setText] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  async function post() {
    const t = text().trim(); if (!t || busy()) return;
    setBusy(true); await props.onSubmit(t); setText(''); setBusy(false);
  }
  return (
    <div>
      <textarea class="input" rows={3} placeholder="Write a comment…" value={text()} onInput={e=>setText(e.currentTarget.value)}
        onKeyDown={e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){ e.preventDefault(); post(); }}} />
      <div class="row" style="margin-top:6px">
        <button class="btn" onClick={post}>Post</button>
        <span style="margin-left:auto;color:#6b7280;font-size:12px">Ctrl/⌘+Enter</span>
      </div>
    </div>
  );
}

function Thread(props: { comment: Comment; onDelete: ()=>void }) {
  const [replies, { mutate }] = createResource(
    () => props.comment.id, id => listReplies(props.comment.noteId, id!)
  );

  return (
    <div class="comment">
      <div class="spread" style="font-size:14px">
        <strong>{props.comment.author}</strong>
        <span class="datechip" title={props.comment.createdAt.toLocaleString()}>{props.comment.createdAt.toLocaleDateString()}</span>
      </div>
      <div style="margin-top:4px;white-space:pre-wrap">{props.comment.text}</div>
      <div class="row" style="margin-top:6px">
        <ReplyBox onReply={async (t)=>{
          const tmp: Comment = { id: -Date.now(), noteId: props.comment.noteId, parentId: props.comment.id!, author: 'me', text: t, createdAt: new Date() };
          mutate(prev => ([...(prev||[]), tmp]));
          const saved = await addComment(props.comment.noteId, props.comment.id!, t);
          mutate(prev => (prev||[]).map(c => c.id===tmp.id ? saved : c));
        }} />
        <button class="btn" onClick={async ()=>{
          if(!confirm('Delete this thread?')) return;
          await props.onDelete();
        }}>Delete</button>
      </div>

      <div class="comment-children">
        <For each={(replies() as Comment[]) || []}>
          {r => (
            <div class="comment" style="margin-top:6px">
              <div class="spread" style="font-size:14px">
                <strong>{r.author}</strong>
                <span class="datechip" title={r.createdAt.toLocaleString()}>{r.createdAt.toLocaleDateString()}</span>
              </div>
              <div style="margin-top:4px;white-space:pre-wrap">{r.text}</div>
              <div class="row" style="margin-top:6px">
                <button class="btn" onClick={async ()=>{
                  if(!confirm('Delete this reply?')) return;
                  await deleteCommentCascade(r.id!);
                  mutate(prev => (prev||[]).filter(x => x.id !== r.id));
                }}>Delete</button>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function ReplyBox(props: { onReply: (text:string)=>void|Promise<void> }) {
  const [text, setText] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  async function post(){ const t=text().trim(); if(!t||busy())return; setBusy(true); await props.onReply(t); setText(''); setBusy(false); }
  return (
    <div class="row" style="gap:6px;flex:1">
      <input class="input" placeholder="Reply…" value={text()} onInput={e=>setText(e.currentTarget.value)}
        onKeyDown={e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){ e.preventDefault(); post(); }}} />
      <button class="btn" onClick={post}>Reply</button>
    </div>
  );
}
