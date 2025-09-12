import type { Stack } from '../lib/db';
import { DateChip } from './DateChip';
import { Link } from '../lib/router';

export function StackCard(props: { stack: Stack }) {
  return (
    <Link class="stackCard" href={`/stack/${props.stack.id}`}>
      <div style="padding:12px">
        <div class="spread">
          <div class="font-semibold" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            {props.stack.title}
          </div>
          <DateChip date={props.stack.updatedAt} />
        </div>
        <div class="row" style="margin-top:6px;color:var(--muted);font-size:12px">Notestack</div>
      </div>
    </Link>
  );
}
