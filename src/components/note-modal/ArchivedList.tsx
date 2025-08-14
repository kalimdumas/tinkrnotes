import { For, Show, createResource, createSignal } from 'solid-js';
import type { Comment } from '../../lib/db';

export function ArchivedList(props: {
  label: string;
  load: () => Promise<Comment[]>;
}) {
  const [open, setOpen] = createSignal(false);
  const [items, { refetch }] = createResource(() => (open() ? 'load' : null), async () => props.load());

  return (
    <div class="mt-3">
      <button class="px-2 py-1 border rounded text-sm" onClick={() => setOpen(!open())}>
        {open() ? 'Hide' : 'Show'} {props.label}
      </button>
      <Show when={open()}>
        <ul class="space-y-2 mt-2">
          <For each={(items() as Comment[]) || []}>
            {(c) => (
              <li class="border rounded p-2 bg-gray-50 opacity-75">
                <div class="text-sm">
                  <span class="font-semibold">{c.author}</span>{' '}
                  <span class="text-gray-500 text-xs">{c.createdAt.toLocaleString()}</span>
                  <span class="text-gray-400 text-xs"> • archived</span>
                </div>
                <div class="mt-1">{c.text}</div>
              </li>
            )}
          </For>
          <Show when={(items() as Comment[] | undefined)?.length === 0}>
            <div class="text-xs text-gray-500 mt-2">No archived items.</div>
          </Show>
        </ul>
      </Show>
    </div>
  );
}
