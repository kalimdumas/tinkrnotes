import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { onMount } from 'solid-js';
import '~/styles.css';

const queryClient = new QueryClient();

export default function RootLayout(props) {
  onMount(() => {
    // initialize PocketBase client if/when you add sync
  });

  return (
    <QueryClientProvider client={queryClient}>
      <main class="flex h-screen">
        {props.children}
      </main>
    </QueryClientProvider>
  );
}
