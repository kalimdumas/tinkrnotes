import { createSignal, Show } from 'solid-js';

export function CommentComposer(props: {
  placeholder?: string;
  onSubmit: (text: string) => Promise<void> | void;
  onCancel?: () => void;
  autoFocus?: boolean;
  rows?: number;
  compact?: boolean; // smaller padding/font
}) {
  const [text, setText] = createSignal('');
  const [busy, setBusy] = createSignal(false);

  async function post() {
    const t = text().trim();
    if (!t || busy()) return;
    setBusy(true);
    try {
      await props.onSubmit(t);
      setText(''); // clear on success
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      post();
    }
  }

  return (
    <div class="mt-2">
      <textarea
        class="w-full border rounded resize-none outline-none"
        style={props.compact ? 'padding:6px 8px; font-size:12px;' : 'padding:8px 10px;'}
        rows={props.rows ?? 2}
        placeholder={props.placeholder ?? 'Write a reply…'}
        value={text()}
        onInput={(e) => setText(e.currentTarget.value)}
        onKeyDown={onKey}
        autofocus={props.autoFocus}
      />
      <div class="mt-1 flex gap-2">
        <button class="px-2 py-1 border rounded text-sm" disabled={busy()} onClick={post}>
          {busy() ? 'Posting…' : 'Post'}
        </button>
        <Show when={props.onCancel}>
          <button class="px-2 py-1 border rounded text-sm" onClick={() => props.onCancel?.()}>
            Cancel
          </button>
        </Show>
        <div class="text-xs text-gray-500 ml-auto">Press ⌘/Ctrl+Enter to post</div>
      </div>
    </div>
  );
}
