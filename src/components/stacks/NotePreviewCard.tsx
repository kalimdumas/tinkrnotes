import { DateChip } from '../DateChip';

function snippet(md: string, n = 280) {
  const s = md.replace(/[#*_>`-]+/g, '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export function NotePreviewCard(props: {
  title: string;
  content: string;
  updatedAt: Date;
  topCommentText: string | null;
  onOpen: () => void;
}) {
  return (
    <button onClick={props.onOpen} class="w-full text-left border rounded hover:bg-gray-50" style="padding:12px; overflow:hidden;">
      <div class="flex items-center">
        <div class="font-semibold truncate">{props.title}</div>
        <DateChip date={props.updatedAt} />
      </div>
      <div class="mt-1 text-sm text-gray-700" style="white-space:pre-wrap; word-break:break-word; overflow-wrap:anywhere;">
        {snippet(props.content)}
      </div>
      {props.topCommentText && (
        <div class="mt-2 text-xs text-gray-500" style="white-space:pre-wrap; word-break:break-word; overflow-wrap:anywhere;">
          <span class="px-1.5 py-0.5 border rounded mr-1">Top comment</span>
          {snippet(props.topCommentText, 180)}
        </div>
      )}
    </button>
  );
}
