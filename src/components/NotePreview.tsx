import { DateChip } from './DateChip';
import { titleOf, snippet } from '../lib/data';
import type { Note } from '../lib/db';

export function NotePreview(props: { note: Note; onOpen: () => void }) {
  return (
    <button class="noteCard" onClick={props.onOpen} title="Open note">
      <div class="spread">
        <div class="font-semibold" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          {titleOf(snippet(props.note.content))}
        </div>
        <DateChip date={props.note.updatedAt} />
      </div>
    </button>
  );
}
