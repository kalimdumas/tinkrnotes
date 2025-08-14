import { For, Show } from 'solid-js';
import type { Comment } from '../../lib/db';

export function PrimaryThreadPreview(props: { list: Comment[] | null }) {
  return (
    <Show when={props.list}>
      <div class="mt-3 border rounded p-2 bg-amber-50">
        <div class="text-sm font-semibold mb-1">Primary thread preview</div>
        <ol class="text-sm space-y-1">
          <For each={props.list!}>
            {(c, i) => (
              <li>
                <span class="text-gray-500">[{i() + 1}]</span> {c.text}
              </li>
            )}
          </For>
        </ol>
      </div>
    </Show>
  );
}
