import type { Notestack as NotestackModel } from '../lib/db';
import { DateChip } from './DateChip';

export function Notestack(props: { stack: NotestackModel; onOpen: () => void }) {
  return (
    <button
      onClick={props.onOpen}
      class="stackCard"
      style="width:100%; text-align:left; cursor:pointer;"
      title="Open notestack"
    >
      <div class="p-3 flex items-start gap-2">
        <div class="flex-1 min-w-0">
          <div class="font-medium truncate">{props.stack.title}</div>
          <div class="text-xs text-gray-500 mt-0.5 flex items-center">
            <span>Stack</span>
            <DateChip date={props.stack.updatedAt} />
          </div>
        </div>
      </div>
    </button>
  );
}
