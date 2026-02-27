import { noteStorage, NoteStorage } from '../storage/note.storage';
import { Note, CreateNoteDTO, UpdateNoteDTO } from '../models/note.model';
import { NotFoundError } from '../errors/app.errors';

export class NoteService {
  constructor(private readonly storage: NoteStorage) {}

  /** Create a new note and persist it. */
  create(dto: CreateNoteDTO): Note {
    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      title: dto.title,
      body: dto.body,
      tags: dto.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    return this.storage.create(note);
  }

  /** List all notes, optionally filtered by tag. */
  list(tag?: string): Note[] {
    return this.storage.findAll(tag);
  }

  /** Get a single note by id. Throws NotFoundError if absent. */
  getById(id: string): Note {
    const note = this.storage.findById(id);
    if (!note) {
      throw new NotFoundError(`Note with id "${id}" not found`);
    }
    return note;
  }

  /** Partially update a note. Throws NotFoundError if absent. */
  update(id: string, dto: UpdateNoteDTO): Note {
    const existing = this.storage.findById(id);
    if (!existing) {
      throw new NotFoundError(`Note with id "${id}" not found`);
    }
    const updated = this.storage.update(id, {
      ...dto,
      updatedAt: new Date().toISOString(),
    });
    // update() returns undefined only if the note was deleted between the
    // findById check and the update call — extremely unlikely but guard anyway.
    if (!updated) {
      throw new NotFoundError(`Note with id "${id}" not found`);
    }
    return updated;
  }

  /** Delete a note by id. Throws NotFoundError if absent. */
  delete(id: string): void {
    const deleted = this.storage.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Note with id "${id}" not found`);
    }
  }

  /** Search notes by tag (alias for list with a required tag). */
  searchByTag(tag: string): Note[] {
    return this.storage.findAll(tag);
  }
}

/** Singleton service instance. */
export const noteService = new NoteService(noteStorage);
