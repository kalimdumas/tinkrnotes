import { Component, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { Dynamic } from 'solid-js/web';

type Params = Record<string, string>;
type Route = { path: string; component: Component<{ params: Params }> };

function match(pattern: string, path: string): Params | null {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Params = {};
  for (let i = 0; i < a.length; i++) {
    const ap = a[i], bp = b[i];
    if (ap.startsWith(':')) params[ap.slice(1)] = decodeURIComponent(bp);
    else if (ap !== bp) return null;
  }
  return params;
}

let navSingleton: ((to: string) => void) | null = null;
export function navigate(to: string) { navSingleton?.(to); }

const currentPath = () => location.hash.slice(1) || '/';

export function RouterProvider(props: { routes: Route[] }) {
  const [path, setPath] = createSignal(currentPath());

  function set(to: string) {
    if (to !== path()) {
      location.hash = to;  // update URL
      setPath(to);         // update reactive path immediately
    }
  }

  onMount(() => {
    navSingleton = set;
    const onHash = () => setPath(currentPath());
    window.addEventListener('hashchange', onHash);
    onCleanup(() => window.removeEventListener('hashchange', onHash));
    if (!location.hash) set('/'); // ensure "#/" on first load
  });

  // 🔁 Reactive outlet: recomputes whenever path() changes
  const outlet = createMemo(() => {
    const p = path();
    for (const r of props.routes) {
      const params = match(r.path, p);
      if (params) return { C: r.component, params };
    }
    return { C: props.routes[0].component, params: {} as Params };
  });

  return <Dynamic component={outlet().C} params={outlet().params} />;
}

export function Link(props: { href: string; class?: string; style?: string; title?: string; children: any }) {
  return (
    <a
      href={`#${props.href}`}
      class={props.class}
      style={props.style}
      title={props.title}
      onClick={(e) => { e.preventDefault(); navigate(props.href); }}
    >
      {props.children}
    </a>
  );
}
