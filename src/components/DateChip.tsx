export function DateChip(props: { date: Date }) {
  return <span class="datechip" title={props.date.toLocaleString()}>{props.date.toLocaleDateString()}</span>;
}
