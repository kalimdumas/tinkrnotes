export function NoteEditor(props: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div style="border-right:1px solid #eee; display:flex; flex-direction:column;">
      <textarea
        class="w-full h-full border-0 p-3 outline-none resize-none"
        placeholder="Write in Markdown…"
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
      />
    </div>
  );
}
