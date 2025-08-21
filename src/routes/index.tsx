import { createSignal } from 'solid-js';
import { AllStacksBoard } from '../components/AllStacksBoard';
import { NoteModal } from '../components/note-modal/NoteModal';
import { NotestackModal } from '../components/stacks/NotestackModal';
import type { Notestack } from '../lib/db';
import { db } from '../lib/db';

export default function Home() {
  const [openNoteId, setOpenNoteId] = createSignal<number | null>(null);
  const [openStack, setOpenStack] = createSignal<Notestack | null>(null);

  async function handleOpenStack(stackId: number) {
    const stk = db ? await db.notestacks.get(stackId) : null;
    setOpenStack(stk || null);
  }

  return (
    <div class="flex h-screen">
      <AllStacksBoard
        onOpenNote={(id) => setOpenNoteId(id)}
        onOpenStack={handleOpenStack}
      />
      <NotestackModal
        open={!!openStack()}
        stack={openStack()}
        onClose={() => setOpenStack(null)}
        onOpenNote={(id) => setOpenNoteId(id)}
      />
      <NoteModal noteId={openNoteId()} onClose={() => setOpenNoteId(null)} />
    </div>
  );
}
