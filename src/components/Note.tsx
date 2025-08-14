import type { Note as NoteModel } from '../lib/db';
import { extractTitle } from '../lib/data';

type NoteRow = { note: NoteModel; isTitleCard: boolean };

export function Note(props: {
  row: NoteRow;
  onOpenNote: (noteId: number) => void;
}) {
  return (
    <li class="bg-gray-50 hover:bg-gray-100 border rounded p-2">
      <div class="flex items-center justify-between">
        <div class="truncate">
          <span
            class={`text-[10px] mr-2 px-1.5 py-0.5 rounded ${
              props.row.isTitleCard ? 'bg-amber-200' : 'bg-gray-200'
            }`}
          >
          </span>
          <span class="font-medium">{extractTitle(props.row.note.content)}</span>
        </div>
        <button class="text-sm underline" onClick={() => props.onOpenNote(props.row.note.id!)}>
          Open
        </button>
      </div>
    </li>
  );
}
