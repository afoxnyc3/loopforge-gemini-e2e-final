import { Note } from '../models/note.model';

/**
 * Thread-safe (single-process) in-memory store backed by a Map.
 * O(1) lookup by id; O(n) for tag-filtered list scans.
 */
export class NoteStorage {
  private readonly store: Map<string, Note> = new Map();

  /** Insert a new note. Throws if the id already exists (should never happen with UUIDs). */
  create(note: Note): Note {
    if (this.store.has(note.id)) {
      throw new Error(`Note with id "${note.id}" already exists`);
    }
    this.store.set(note.id, { ...note });
    return { ...note };
  }

  /** Return all notes, optionally filtered by a single tag. */
  findAll(tag?: string): Note[] {
    const notes = Array.from(this.store.values());
    if (tag === undefined) {
      return notes.map((n) => ({ ...n }));
    }
    const lower = tag.toLowerCase();
    return notes
      .filter((n) => n.tags.some((t) => t.toLowerCase() === lower))
      .map((n) => ({ ...n }));
  }

  /** Return a note by id, or undefined if not found. */
  findById(id: string): Note | undefined {
    const note = this.store.get(id);
    return note ? { ...note } : undefined;
  }

  /**
   * Partially update a note.
   * Returns the updated note, or undefined if not found.
   */
  update(id: string, patch: Partial<Pick<Note, 'title' | 'body' | 'tags' | 'updatedAt'>>): Note | undefined {
    const existing = this.store.get(id);
    if (!existing) return undefined;
    const updated: Note = { ...existing, ...patch };
    this.store.set(id, updated);
    return { ...updated };
  }

  /** Delete a note by id. Returns true if it existed, false otherwise. */
  delete(id: string): boolean {
    return this.store.delete(id);
  }

  /** Number of stored notes (useful for tests). */
  size(): number {
    return this.store.size;
  }

  /** Clear all notes (useful for tests). */
  clear(): void {
    this.store.clear();
  }
}

/** Singleton instance shared across the application. */
export const noteStorage = new NoteStorage();
