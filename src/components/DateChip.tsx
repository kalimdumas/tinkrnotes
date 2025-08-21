export function DateChip(props: { date: Date; title?: string }) {
  return (
    <span
      title={props.title || props.date.toLocaleString()}
      style="margin-left:auto; font-size:11px; color:#6B7280; white-space:nowrap;"
    >
      {props.date.toLocaleDateString()}
    </span>
  );
}
