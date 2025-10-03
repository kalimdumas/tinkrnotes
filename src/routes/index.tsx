import { For, Show, createResource, createSignal, onMount } from 'solid-js';
import { listCategories, listStacksByCategory, seedDefaults, createStack } from '../lib/data';
import type { Category, Stack } from '../lib/db';
import { StackCard } from '../components/StackCard';
import { signIn, signOut, getUserId, syncNow } from '../lib/sync';

export default function Board() {
  const [filter, setFilter] = createSignal('');
  const [userId, setUserId] = createSignal<string | null>(null);
  const [categories, { refetch }] = createResource(listCategories);

  onMount(async () => {
    await seedDefaults(); await refetch();
    setUserId(await getUserId());
    // attempt initial sync if logged in
    if (userId()) await syncNow();
    // auto-sync when coming back online
    window.addEventListener('online', () => { if (userId()) syncNow(); });
  });

  function matches(s: Stack) {
    const q = filter().trim().toLowerCase();
    return !q || s.title.toLowerCase().includes(q);
  }

  return (
    <section style="height:100%;display:flex;flex-direction:column">
      <div class="container">
        <div class="row" style="padding:12px; gap:12px; align-items:center">
          <input class="input" style="max-width:420px" placeholder="Filter stacks…"
                 onInput={e=>setFilter(e.currentTarget.value)} />
          <span style="margin-left:auto"></span>
          <Show when={userId()} fallback={<AuthForm onSignedIn={async()=>{ setUserId(await getUserId()); await syncNow(); }} />}>
            <button class="btn" onClick={async()=>{ await syncNow(); }}>Sync now</button>
            <button class="btn" onClick={async()=>{ await signOut(); setUserId(null); }}>Sign out</button>
          </Show>
        </div>
      </div>

      <div class="container">
        <div class="board">
          <For each={(categories() as Category[]) || []}>
            {cat => <CategoryColumn category={cat} matches={matches} />}
          </For>
        </div>
      </div>
    </section>
  );
}

function AuthForm(props: { onSignedIn: ()=>void }) {
  const [email, setEmail] = createSignal('');
  const [sent, setSent] = createSignal(false);
  async function submit() {
    if (!email().trim()) return;
    await signIn(email().trim());
    setSent(true);
  }
  return (
    <div class="row" style="gap:8px">
      <Show when={!sent()} fallback={<span style="color:#10b981">Check your email</span>}>
        <input class="input" style="max-width:220px" type="email" placeholder="Email for sync"
          value={email()} onInput={e=>setEmail(e.currentTarget.value)} />
        <button class="btn" onClick={submit}>Sign in</button>
      </Show>
    </div>
  );
}

function CategoryColumn(props: { category: Category; matches: (s: Stack)=>boolean }) {
  const [stacks, { mutate, refetch }] = createResource(
    () => props.category.id, id => listStacksByCategory(id!)
  );

  async function add() {
    const title = prompt('New notestack title?'); if (!title) return;
    const tmp: Stack = {
      id: -Date.now(),
      uid: crypto.randomUUID(),
      title,
      categoryId: props.category.id!,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mutate(prev => ([...(prev||[]), tmp])); // optimistic add
    const real = await createStack(props.category.id!, title);
    mutate(prev => (prev||[]).map(s => s.id===tmp.id ? { ...tmp, id: real } : s));
    await refetch();
  }

  return (
    <div style="min-width:0">
      <div class="spread" style="margin:4px 0 8px 0">
        <h3 style="margin:0">{props.category.name}</h3>
        <button class="btn" onClick={add}>+ New</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <For each={((stacks() as Stack[]) || []).filter(props.matches)}>
          {s => <StackCard stack={s} />}
        </For>
      </div>
    </div>
  );
}
