import request from 'supertest';
import { createApp } from '../../app';
import { Express } from 'express';

/**
 * Additional edge case tests to supplement the main integration suite.
 * These cover scenarios identified during QA review.
 */
describe('Notes API — Edge Cases', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  describe('POST /notes — edge cases', () => {
    it('should create a note with empty tags array', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'No Tags Note', body: 'Body content', tags: [] })
        .expect(201);

      expect(res.body.tags).toEqual([]);
    });

    it('should create a note with multiple tags', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'Multi Tag', body: 'Body', tags: ['alpha', 'beta', 'gamma'] })
        .expect(201);

      expect(res.body.tags).toHaveLength(3);
      expect(res.body.tags).toContain('alpha');
    });

    it('should return 422 when tags contains non-string elements', async () => {
      await request(app)
        .post('/notes')
        .send({ title: 'Bad Tags', body: 'Body', tags: [1, 2, 3] })
        .expect(422);
    });

    it('should return 422 when title is empty string', async () => {
      await request(app)
        .post('/notes')
        .send({ title: '', body: 'Body', tags: [] })
        .expect(422);
    });

    it('should return 422 when body is empty string', async () => {
      await request(app)
        .post('/notes')
        .send({ title: 'Title', body: '', tags: [] })
        .expect(422);
    });

    it('should set createdAt and updatedAt on creation', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'Timestamp Test', body: 'Body', tags: [] })
        .expect(201);

      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
      expect(new Date(res.body.createdAt).getTime()).not.toBeNaN();
    });

    it('should assign a UUID id on creation', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'UUID Test', body: 'Body', tags: [] })
        .expect(201);

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(res.body.id).toMatch(uuidRegex);
    });
  });

  describe('PUT /notes/:id — edge cases', () => {
    it('should update note to have empty tags array', async () => {
      const createRes = await request(app)
        .post('/notes')
        .send({ title: 'Original', body: 'Body', tags: ['tag1', 'tag2'] })
        .expect(201);

      const id = createRes.body.id;

      const updateRes = await request(app)
        .put(`/notes/${id}`)
        .send({ tags: [] })
        .expect(200);

      expect(updateRes.body.tags).toEqual([]);
    });

    it('should preserve unchanged fields on partial update', async () => {
      const createRes = await request(app)
        .post('/notes')
        .send({ title: 'Original Title', body: 'Original Body', tags: ['tag1'] })
        .expect(201);

      const id = createRes.body.id;

      const updateRes = await request(app)
        .put(`/notes/${id}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(updateRes.body.title).toBe('Updated Title');
      expect(updateRes.body.body).toBe('Original Body');
      expect(updateRes.body.tags).toEqual(['tag1']);
    });

    it('should update updatedAt timestamp on update', async () => {
      const createRes = await request(app)
        .post('/notes')
        .send({ title: 'Title', body: 'Body', tags: [] })
        .expect(201);

      const id = createRes.body.id;
      const originalUpdatedAt = createRes.body.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateRes = await request(app)
        .put(`/notes/${id}`)
        .send({ title: 'New Title' })
        .expect(200);

      expect(new Date(updateRes.body.updatedAt).getTime())
        .toBeGreaterThanOrEqual(new Date(originalUpdatedAt).getTime());
    });
  });

  describe('GET /notes/search — edge cases', () => {
    beforeEach(async () => {
      await request(app).post('/notes').send({ title: 'Note 1', body: 'B', tags: ['javascript', 'node'] });
      await request(app).post('/notes').send({ title: 'Note 2', body: 'B', tags: ['javascript', 'react'] });
      await request(app).post('/notes').send({ title: 'Note 3', body: 'B', tags: ['python'] });
    });

    it('should return all notes matching the tag', async () => {
      const res = await request(app)
        .get('/notes/search?tag=javascript')
        .expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('should return empty array for non-existent tag', async () => {
      const res = await request(app)
        .get('/notes/search?tag=nonexistent')
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('should be case-sensitive in tag matching', async () => {
      const res = await request(app)
        .get('/notes/search?tag=JavaScript')
        .expect(200);

      // Tags are stored as-is; 'JavaScript' !== 'javascript'
      expect(res.body).toHaveLength(0);
    });

    it('should return 400 when tag query param is missing', async () => {
      await request(app)
        .get('/notes/search')
        .expect(400);
    });
  });

  describe('Route ordering — /notes/search vs /notes/:id', () => {
    it('should not treat "search" as a note ID', async () => {
      // If routes are ordered incorrectly, GET /notes/search would match /:id
      // and return 404 with message about note not found rather than search results
      const res = await request(app)
        .get('/notes/search?tag=test')
        .expect(200);

      // Should return array (search results), not a 404 error object
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Error response format', () => {
    it('should return JSON error with correct Content-Type on 404', async () => {
      const res = await request(app)
        .get('/notes/nonexistent-id')
        .expect(404);

      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
    });

    it('should return JSON error with correct Content-Type on 422', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'Missing body field' })
        .expect(422);

      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 for completely unknown routes', async () => {
      const res = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(res.body).toHaveProperty('error');
    });
  });
});
