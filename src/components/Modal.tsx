import { JSX, Show, onMount, onCleanup } from 'solid-js';

export function Modal(props: {
  open: boolean;
  title?: string;
  width?: string;   // e.g., "min(1100px,98vw)"
  height?: string;  // e.g., "95vh"
  onClose: () => void;
  children: JSX.Element;
}) {
  let modalRef!: HTMLDivElement;
  let outsideDown = false;

  // Attach keyboard handler only on the client
  onMount(() => {
    if (typeof window === 'undefined') return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
    };
    window.addEventListener('keydown', key);
    onCleanup(() => window.removeEventListener('keydown', key));
  });

  function onBackdropMouseDown(e: MouseEvent) {
    outsideDown = modalRef ? !modalRef.contains(e.target as Node) : true;
  }
  function onBackdropMouseUp(e: MouseEvent) {
    const outsideUp = modalRef ? !modalRef.contains(e.target as Node) : true;
    if (outsideDown && outsideUp) props.onClose();
    outsideDown = false;
  }

  return (
    <Show when={props.open}>
      <div
        style="position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:50;"
        onMouseDown={onBackdropMouseDown}
        onMouseUp={onBackdropMouseUp}
      >
        <div
          ref={modalRef}
          style={`width:${props.width || 'min(1100px,98vw)'}; max-height:${props.height || '95vh'}; background:#fff; border:2px solid #cfcfcf; border-radius:12px; overflow:hidden; display:flex; flex-direction:column;`}
        >
          <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #e6e6e6;">
            <div style="font-weight:600;">{props.title}</div>
            <button class="px-2 py-1 border rounded" onClick={props.onClose}>Close</button>
          </div>
          {props.children}
        </div>
      </div>
    </Show>
  );
}
