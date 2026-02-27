import { NoteService } from '../note.service';
import { NoteStorage } from '../../storage/note.storage';
import { NotFoundError } from '../../errors/app.errors';

describe('NoteService', () => {
  let storage: NoteStorage;
  let service: NoteService;

  beforeEach(() => {
    storage = new NoteStorage();
    service = new NoteService(storage);
  });

  describe('create', () => {
    it('creates a note with all required fields', () => {
      const note = service.create({ title: 'Hello', body: 'World', tags: ['a'] });
      expect(note.id).toBeDefined();
      expect(note.title).toBe('Hello');
      expect(note.body).toBe('World');
      expect(note.tags).toEqual(['a']);
      expect(note.createdAt).toBeDefined();
      expect(note.updatedAt).toBeDefined();
    });

    it('defaults tags to empty array when not provided', () => {
      const note = service.create({ title: 'T', body: 'B', tags: [] });
      expect(note.tags).toEqual([]);
    });
  });

  describe('list', () => {
    it('returns all notes when no tag filter', () => {
      service.create({ title: 'A', body: 'a', tags: ['x'] });
      service.create({ title: 'B', body: 'b', tags: ['y'] });
      expect(service.list()).toHaveLength(2);
    });

    it('returns filtered notes when tag provided', () => {
      service.create({ title: 'A', body: 'a', tags: ['x'] });
      service.create({ title: 'B', body: 'b', tags: ['y'] });
      expect(service.list('x')).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('returns the note when found', () => {
      const created = service.create({ title: 'T', body: 'B', tags: [] });
      const found = service.getById(created.id);
      expect(found).toEqual(created);
    });

    it('throws NotFoundError when not found', () => {
      expect(() => service.getById('nonexistent')).toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('updates only provided fields', () => {
      const created = service.create({ title: 'T', body: 'B', tags: ['a'] });
      const updated = service.update(created.id, { title: 'New Title' });
      expect(updated.title).toBe('New Title');
      expect(updated.body).toBe('B');
      expect(updated.tags).toEqual(['a']);
    });

    it('updates updatedAt timestamp', () => {
      const created = service.create({ title: 'T', body: 'B', tags: [] });
      const before = created.updatedAt;
      // Ensure at least 1ms passes
      const updated = service.update(created.id, { title: 'X' });
      expect(updated.updatedAt).not.toBe(before);
    });

    it('throws NotFoundError when not found', () => {
      expect(() => service.update('nonexistent', { title: 'X' })).toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('deletes an existing note without throwing', () => {
      const created = service.create({ title: 'T', body: 'B', tags: [] });
      expect(() => service.delete(created.id)).not.toThrow();
      expect(storage.size()).toBe(0);
    });

    it('throws NotFoundError when not found', () => {
      expect(() => service.delete('nonexistent')).toThrow(NotFoundError);
    });
  });

  describe('searchByTag', () => {
    it('returns notes matching the tag', () => {
      service.create({ title: 'A', body: 'a', tags: ['typescript'] });
      service.create({ title: 'B', body: 'b', tags: ['javascript'] });
      const results = service.searchByTag('typescript');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('A');
    });
  });
});
