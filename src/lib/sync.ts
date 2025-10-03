import { supabase } from './supabase';
import { db } from './db';

/* --- auth --- */
export async function signIn(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
  return true; // magic link sent
}
export async function signOut() {
  await supabase.auth.signOut();
}
export async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/* --- category helpers --- */
async function categoryNameById(id: number): Promise<string> {
  const cat = await db!.categories.get(id);
  return cat?.name || 'Hobbies';
}
async function categoryIdByName(name: string): Promise<number> {
  let cat = await db!.categories.where({ name }).first();
  if (!cat) {
    const now = new Date();
    const id = await db!.categories.add({ name, createdAt: now, updatedAt: now });
    cat = { id, name, createdAt: now, updatedAt: now };
  }
  return cat.id!;
}

/* --- SYNC --- */
export async function syncNow() {
  const uid = await getUserId();
  if (!uid) return;

  await pushAll(uid);
  await pullAll(uid);
}

async function pushAll(userId: string) {
  // stacks
  const stacks = await db!.stacks.toArray();
  if (stacks.length) {
    const payload = await Promise.all(
      stacks.map(async s => ({
        uid: s.uid,
        user_id: userId,
        title: s.title,
        category: await categoryNameById(s.categoryId),
        updated_at: s.updatedAt.toISOString()
      }))
    );
    const { error } = await supabase.from('stacks').upsert(payload, { onConflict: 'uid' });
    if (error) console.error('upsert stacks error', error);
  }

  // notes
  const notes = await db!.notes.toArray();
  if (notes.length) {
    const stackById = new Map<number, string>();
    for (const s of stacks) stackById.set(s.id!, s.uid);

    const payload = notes
      .map(n => {
        const stack_uid = stackById.get(n.stackId);
        if (!stack_uid) return null; // skip if local stack not yet pushed
        return {
          uid: n.uid,
          user_id: userId,
          stack_uid,
          content: n.content,
          created_at: n.createdAt.toISOString(),
          updated_at: n.updatedAt.toISOString()
        };
      })
      .filter(Boolean) as any[];

    if (payload.length) {
      const { error } = await supabase.from('notes').upsert(payload, { onConflict: 'uid' });
      if (error) console.error('upsert notes error', error);
    }
  }

  // comments — two-phase to satisfy FK on parent_uid
  const comments = await db!.comments.toArray();
  if (comments.length) {
    const noteById = new Map<number, string>();
    for (const n of notes) noteById.set(n.id!, n.uid);

    const commentById = new Map<number, string>();
    for (const c of comments) commentById.set(c.id!, c.uid);

    // phase 1: top-level comments (no parent)
    const roots = comments
      .filter(c => !c.parentId)
      .map(c => {
        const note_uid = noteById.get(c.noteId);
        if (!note_uid) return null;
        return {
          uid: c.uid,
          user_id: userId,
          note_uid,
          parent_uid: null,
          author: c.author,
          text: c.text,
          created_at: c.createdAt.toISOString()
        };
      })
      .filter(Boolean) as any[];

    if (roots.length) {
      const { error } = await supabase.from('comments').upsert(roots, { onConflict: 'uid' });
      if (error) console.error('upsert root comments error', error);
    }

    // phase 2: replies (parent now exists on server)
    const replies = comments
      .filter(c => !!c.parentId)
      .map(c => {
        const note_uid = noteById.get(c.noteId);
        const parent_uid = c.parentId ? commentById.get(c.parentId) ?? null : null;
        if (!note_uid || !parent_uid) return null; // skip if mapping missing
        return {
          uid: c.uid,
          user_id: userId,
          note_uid,
          parent_uid,
          author: c.author,
          text: c.text,
          created_at: c.createdAt.toISOString()
        };
      })
      .filter(Boolean) as any[];

    if (replies.length) {
      const { error } = await supabase.from('comments').upsert(replies, { onConflict: 'uid' });
      if (error) console.error('upsert reply comments error', error);
    }
  }
}

async function pullAll(userId: string) {
  // pull stacks
  const { data: rStacks, error: e1 } = await supabase
    .from('stacks')
    .select('*')
    .eq('user_id', userId);
  if (e1) throw e1;

  const localStacks = await db!.stacks.toArray();
  const uidToLocalStack = new Map(localStacks.map(s => [s.uid, s.id!]));

  for (const rs of rStacks || []) {
    const catId = await categoryIdByName(rs.category);
    const existingId = uidToLocalStack.get(rs.uid);
    const row = {
      uid: rs.uid as string,
      title: rs.title as string,
      categoryId: catId,
      createdAt: new Date(rs.updated_at),
      updatedAt: new Date(rs.updated_at)
    };
    if (existingId) {
      await db!.stacks.update(existingId, row);
    } else {
      await db!.stacks.add(row as any);
    }
  }

  // pull notes
  const { data: rNotes, error: e2 } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId);
  if (e2) throw e2;

  const stacksReload = await db!.stacks.toArray();
  const stackUidToLocalId = new Map(stacksReload.map(s => [s.uid, s.id!]));

  const localNotes = await db!.notes.toArray();
  const noteUidToLocalId = new Map(localNotes.map(n => [n.uid, n.id!]));

  for (const rn of rNotes || []) {
    const stackId = stackUidToLocalId.get(rn.stack_uid as string);
    if (!stackId) continue;
    const existingId = noteUidToLocalId.get(rn.uid);
    const row = {
      uid: rn.uid as string,
      stackId,
      content: rn.content as string,
      createdAt: new Date(rn.created_at),
      updatedAt: new Date(rn.updated_at)
    };
    if (existingId) {
      await db!.notes.update(existingId, row);
    } else {
      await db!.notes.add(row as any);
    }
  }

  // pull comments (two-pass to ensure parents exist)
  const { data: rComments, error: e3 } = await supabase
    .from('comments')
    .select('*')
    .eq('user_id', userId);
  if (e3) throw e3;

  const notesReload = await db!.notes.toArray();
  const noteUidToId = new Map(notesReload.map(n => [n.uid, n.id!]));
  const localComments = await db!.comments.toArray();
  const commentUidToId = new Map(localComments.map(c => [c.uid, c.id!]));

  // first pass: top-level
  for (const rc of (rComments || []).filter(c => !c.parent_uid)) {
    const noteId = noteUidToId.get(rc.note_uid as string);
    if (!noteId) continue;
    const existingId = commentUidToId.get(rc.uid);
    const row = {
      uid: rc.uid as string,
      noteId,
      parentId: null,
      author: rc.author as string,
      text: rc.text as string,
      createdAt: new Date(rc.created_at)
    };
    if (existingId) await db!.comments.update(existingId, row);
    else await db!.comments.add(row as any);
  }

  // rebuild comment map after top-level
  const commentsReload = await db!.comments.toArray();
  const uidToCommentId = new Map(commentsReload.map(c => [c.uid, c.id!]));

  // second pass: replies
  for (const rc of (rComments || []).filter(c => !!c.parent_uid)) {
    const noteId = noteUidToId.get(rc.note_uid as string);
    const parentId = uidToCommentId.get(rc.parent_uid as string);
    if (!noteId || !parentId) continue;
    const existingId = uidToCommentId.get(rc.uid);
    const row = {
      uid: rc.uid as string,
      noteId,
      parentId,
      author: rc.author as string,
      text: rc.text as string,
      createdAt: new Date(rc.created_at)
    };
    if (existingId) await db!.comments.update(existingId, row);
    else await db!.comments.add(row as any);
  }
}
