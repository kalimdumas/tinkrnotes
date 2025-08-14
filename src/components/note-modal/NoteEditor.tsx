export function NoteEditor(props: {
  value: string;
  onChange: (val: string) => void;
  basis?: string; // e.g., "30%"
}) {
  return (
    <div
      style={`
        flex: 0 0 ${props.basis ?? '30%'};
        min-height:0;
        border-bottom:1px solid #eee;
        display:flex; flex-direction:column;
      `}
    >
      <textarea
        class="w-full border-0 p-3 outline-none"
        style="height:100%; min-height:0; overflow:auto; resize:none;"
        placeholder="Write in Markdown…"
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
      />
    </div>
  );
}
