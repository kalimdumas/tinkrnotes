import { createSignal } from 'solid-js';
import { AllStacksBoard } from '../components/AllStacksBoard';
import { NoteModal } from '../components/note-modal/NoteModal';

export default function Home() {
  const [openNoteId, setOpenNoteId] = createSignal<number | null>(null);

  return (
    <div class="flex h-screen">
      <AllStacksBoard onOpenNote={(id) => setOpenNoteId(id)} />
      <NoteModal noteId={openNoteId()} onClose={() => setOpenNoteId(null)} />
    </div>
  );
}
