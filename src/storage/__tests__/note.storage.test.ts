import { NoteStorage } from '../note.storage';
import { Note } from '../../models/note.model';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: crypto.randomUUID(),
    title: 'Test Note',
    body: 'Test body',
    tags: ['test'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('NoteStorage', () => {
  let storage: NoteStorage;

  beforeEach(() => {
    storage = new NoteStorage();
  });

  describe('create', () => {
    it('stores a note and returns a copy', () => {
      const note = makeNote();
      const result = storage.create(note);
      expect(result).toEqual(note);
      expect(storage.size()).toBe(1);
    });

    it('throws if a note with the same id already exists', () => {
      const note = makeNote();
      storage.create(note);
      expect(() => storage.create(note)).toThrow();
    });

    it('returns a defensive copy (mutations do not affect stored note)', () => {
      const note = makeNote({ tags: ['a'] });
      const result = storage.create(note);
      result.tags.push('b');
      const fetched = storage.findById(note.id);
      expect(fetched?.tags).toEqual(['a']);
    });
  });

  describe('findAll', () => {
    it('returns all notes when no tag is provided', () => {
      storage.create(makeNote({ id: crypto.randomUUID(), tags: ['a'] }));
      storage.create(makeNote({ id: crypto.randomUUID(), tags: ['b'] }));
      expect(storage.findAll()).toHaveLength(2);
    });

    it('filters by tag (case-insensitive)', () => {
      storage.create(makeNote({ id: crypto.randomUUID(), tags: ['TypeScript'] }));
      storage.create(makeNote({ id: crypto.randomUUID(), tags: ['javascript'] }));
      const results = storage.findAll('typescript');
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('TypeScript');
    });

    it('returns empty array when no notes match the tag', () => {
      storage.create(makeNote({ id: crypto.randomUUID(), tags: ['a'] }));
      expect(storage.findAll('nonexistent')).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('returns the note if it exists', () => {
      const note = makeNote();
      storage.create(note);
      expect(storage.findById(note.id)).toEqual(note);
    });

    it('returns undefined for unknown id', () => {
      expect(storage.findById('unknown')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('applies partial updates and returns the updated note', () => {
      const note = makeNote();
      storage.create(note);
      const updated = storage.update(note.id, { title: 'New Title', updatedAt: 'new-ts' });
      expect(updated?.title).toBe('New Title');
      expect(updated?.body).toBe(note.body);
      expect(updated?.updatedAt).toBe('new-ts');
    });

    it('returns undefined for unknown id', () => {
      expect(storage.update('unknown', { title: 'x' })).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('removes the note and returns true', () => {
      const note = makeNote();
      storage.create(note);
      expect(storage.delete(note.id)).toBe(true);
      expect(storage.size()).toBe(0);
    });

    it('returns false for unknown id', () => {
      expect(storage.delete('unknown')).toBe(false);
    });
  });
});
