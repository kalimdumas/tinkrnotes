import { For, createResource, createSignal, onMount } from 'solid-js';
import { listCategories, listStacksByCategory, seedDefaults, createStack } from '../lib/data';
import type { Category, Stack } from '../lib/db';
import { StackCard } from '../components/StackCard';

export default function Board() {
  const [filter, setFilter] = createSignal('');
  const [categories, { refetch }] = createResource(listCategories);

  onMount(async () => { await seedDefaults(); await refetch(); });

  function matches(s: Stack) {
    const q = filter().trim().toLowerCase();
    return !q || s.title.toLowerCase().includes(q);
  }

  return (
    <section style="height:100%;display:flex;flex-direction:column">
      {/* centered filter bar */}
      <div class="container">
        <div class="row" style="padding:12px">
          <input
            class="input"
            style="max-width:420px"
            placeholder="Filter stacks…"
            onInput={e=>setFilter(e.currentTarget.value)}
          />
        </div>
      </div>

      {/* centered columns grid */}
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

function CategoryColumn(props: { category: Category; matches: (s: Stack)=>boolean }) {
  const [stacks, { mutate, refetch }] = createResource(
    () => props.category.id, id => listStacksByCategory(id!)
  );

  async function add() {
    const title = prompt('New notestack title?'); if (!title) return;
    const tmp: Stack = { id: -Date.now(), title, categoryId: props.category.id!, createdAt: new Date(), updatedAt: new Date() };
    mutate(prev => ([...(prev||[]), tmp])); // optimistic
    const real = await createStack(props.category.id!, title);
    mutate(prev => (prev||[]).map(s => s.id===tmp.id ? { ...tmp, id: real } : s));
    await refetch();
  }

  return (
    <div style="min-width:18rem">
      <div class="spread" style="margin:4px 0 8px 0">
        <h3 style={{ margin: 0 }}>{props.category.name}</h3>
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
