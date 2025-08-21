import { JSX } from 'solid-js';

export function CommentCard(props: {
  author: string;
  createdAt: Date;
  text: string;
  showPrimaryButton?: boolean;
  canSetPrimary?: boolean;
  isOwner?: boolean;
  onShowPrimaryThread?: () => void;
  onSetPrimary?: () => void;
  onToggleReply?: () => void;
  replyOpen?: boolean;
  rightActions?: JSX.Element;
  children?: JSX.Element;
}) {
  const initials = (props.author?.[0] ?? '•').toUpperCase();
  return (
    <div class="border rounded p-2 bg-gray-50" style="overflow:hidden;">
      <div class="text-sm" style="display:flex; gap:10px; align-items:flex-start;">
        <div style="width:28px; height:28px; border-radius:9999px; background:#EEF2FF; color:#3730A3; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; flex:0 0 auto;" title={props.author}>
          {initials}
        </div>
        <div style="min-width:0; flex:1 1 auto;">
          <div style="display:flex; align-items:baseline; justify-content:space-between; gap:8px;">
            <div style="min-width:0; flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              <span style="font-weight:600;">{props.author}</span>
              <span style="color:#6B7280; font-size:12px; margin-left:8px;">{props.createdAt.toLocaleString()}</span>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; flex:0 0 auto;">
              {props.showPrimaryButton && (<button class="btn-ghost" onClick={props.onShowPrimaryThread}>Show primary</button>)}
              {props.canSetPrimary && (<button class="btn-ghost" onClick={props.onSetPrimary}>Set primary</button>)}
              {props.onToggleReply && (<button class="btn-ghost" onClick={props.onToggleReply}>{props.replyOpen ? 'Cancel' : 'Reply'}</button>)}
              {props.rightActions}
            </div>
          </div>
          <div class="mt-1" style="white-space:pre-wrap; word-break:break-word; overflow-wrap:anywhere; line-height:1.35;">
            {props.text}
          </div>
          {props.children}
        </div>
      </div>
    </div>
  );
}
