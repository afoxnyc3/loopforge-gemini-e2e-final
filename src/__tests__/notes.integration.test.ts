import request from 'supertest';
import { createApp } from '../app';
import { noteStorage } from '../storage/note.storage';
import { Application } from 'express';

describe('Notes API — Integration', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    noteStorage.clear();
  });

  // ── Health ────────────────────────────────────────────────────────────────
  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  // ── Create ────────────────────────────────────────────────────────────────
  describe('POST /notes', () => {
    it('creates a note and returns 201 with the note', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'My Note', body: 'Some content', tags: ['test'] });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('My Note');
      expect(res.body.body).toBe('Some content');
      expect(res.body.tags).toEqual(['test']);
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    it('defaults tags to [] when omitted', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'T', body: 'B' });
      expect(res.status).toBe(201);
      expect(res.body.tags).toEqual([]);
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ body: 'No title' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when body is missing', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'No body' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid tag format', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'T', body: 'B', tags: ['invalid tag!'] });
      expect(res.status).toBe(400);
    });
  });

  // ── List ──────────────────────────────────────────────────────────────────
  describe('GET /notes', () => {
    it('returns empty array when no notes exist', async () => {
      const res = await request(app).get('/notes');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all notes', async () => {
      await request(app).post('/notes').send({ title: 'A', body: 'a', tags: ['x'] });
      await request(app).post('/notes').send({ title: 'B', body: 'b', tags: ['y'] });
      const res = await request(app).get('/notes');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('filters by tag query param', async () => {
      await request(app).post('/notes').send({ title: 'A', body: 'a', tags: ['alpha'] });
      await request(app).post('/notes').send({ title: 'B', body: 'b', tags: ['beta'] });
      const res = await request(app).get('/notes?tag=alpha');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('A');
    });
  });

  // ── Get by ID ─────────────────────────────────────────────────────────────
  describe('GET /notes/:id', () => {
    it('returns the note when it exists', async () => {
      const created = await request(app)
        .post('/notes')
        .send({ title: 'T', body: 'B', tags: [] });
      const res = await request(app).get(`/notes/${created.body.id as string}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).get('/notes/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for non-UUID id', async () => {
      const res = await request(app).get('/notes/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });

  // ── Update ────────────────────────────────────────────────────────────────
  describe('PATCH /notes/:id', () => {
    it('partially updates a note', async () => {
      const created = await request(app)
        .post('/notes')
        .send({ title: 'Old', body: 'B', tags: [] });
      const res = await request(app)
        .patch(`/notes/${created.body.id as string}`)
        .send({ title: 'New' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New');
      expect(res.body.body).toBe('B');
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .patch('/notes/00000000-0000-0000-0000-000000000000')
        .send({ title: 'X' });
      expect(res.status).toBe(404);
    });

    it('returns 400 when body is empty', async () => {
      const created = await request(app)
        .post('/notes')
        .send({ title: 'T', body: 'B', tags: [] });
      const res = await request(app)
        .patch(`/notes/${created.body.id as string}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  describe('DELETE /notes/:id', () => {
    it('deletes a note and returns 204', async () => {
      const created = await request(app)
        .post('/notes')
        .send({ title: 'T', body: 'B', tags: [] });
      const res = await request(app).delete(`/notes/${created.body.id as string}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app).delete('/notes/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  // ── Search ────────────────────────────────────────────────────────────────
  describe('GET /notes/search', () => {
    it('returns notes matching the tag', async () => {
      await request(app).post('/notes').send({ title: 'A', body: 'a', tags: ['typescript'] });
      await request(app).post('/notes').send({ title: 'B', body: 'b', tags: ['javascript'] });
      const res = await request(app).get('/notes/search?tag=typescript');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('A');
    });

    it('returns 400 when tag query param is missing', async () => {
      const res = await request(app).get('/notes/search');
      expect(res.status).toBe(400);
    });

    it('returns empty array when no notes match', async () => {
      const res = await request(app).get('/notes/search?tag=nonexistent');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ── Unknown routes ────────────────────────────────────────────────────────
  describe('Unknown routes', () => {
    it('returns 404 for unregistered paths', async () => {
      const res = await request(app).get('/unknown');
      expect(res.status).toBe(404);
    });
  });
});
