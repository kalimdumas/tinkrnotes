import type { Note as NoteModel } from '../lib/db';
import { extractTitle } from '../lib/data';

type NoteRow = { note: NoteModel; isTitleCard: boolean };

export function Note(props: {
  row: NoteRow;
  onOpenNote: (noteId: number) => void;
}) {
  return (
    <li class="bg-gray-50 hover:bg-gray-100 border rounded p-2" style="overflow:hidden;">
      <div class="flex items-center justify-between gap-2">
        <div style="min-width:0; flex:1 1 auto;">
          <span
            class={`text-[10px] mr-2 px-1.5 py-0.5 rounded ${
              props.row.isTitleCard ? 'bg-amber-200' : 'bg-gray-200'
            }`}
          >
          </span>
          <span
            class="font-medium"
            style="display:inline-block; max-width:100%; overflow:hidden; text-overflow:ellipsis; word-break:break-word; overflow-wrap:anywhere; vertical-align:bottom;"
          >
            {extractTitle(props.row.note.content)}
          </span>
        </div>
        <button
          class="text-sm underline flex-none"
          onClick={() => props.onOpenNote(props.row.note.id!)}
        >
          Open
        </button>
      </div>
    </li>
  );
}
