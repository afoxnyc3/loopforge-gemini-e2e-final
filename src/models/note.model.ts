import { z } from 'zod';

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------
export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/** Shared field constraints */
const titleSchema = z
  .string()
  .min(1, 'Title must not be empty')
  .max(200, 'Title must be at most 200 characters');

const bodySchema = z
  .string()
  .min(1, 'Body must not be empty')
  .max(10_000, 'Body must be at most 10 000 characters');

const tagSchema = z
  .string()
  .min(1, 'Tag must not be empty')
  .max(50, 'Tag must be at most 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Tag may only contain letters, digits, hyphens and underscores');

const tagsSchema = z
  .array(tagSchema)
  .max(20, 'A note may have at most 20 tags')
  .default([]);

/** POST /notes */
export const CreateNoteSchema = z.object({
  title: titleSchema,
  body: bodySchema,
  tags: tagsSchema,
});

export type CreateNoteDTO = z.infer<typeof CreateNoteSchema>;

/** PATCH /notes/:id */
export const UpdateNoteSchema = z
  .object({
    title: titleSchema.optional(),
    body: bodySchema.optional(),
    tags: tagsSchema.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' },
  );

export type UpdateNoteDTO = z.infer<typeof UpdateNoteSchema>;

/** GET /notes?tag=... */
export const ListNotesQuerySchema = z.object({
  tag: tagSchema.optional(),
});

export type ListNotesQuery = z.infer<typeof ListNotesQuerySchema>;

/** GET /notes/search?tag=... */
export const SearchQuerySchema = z.object({
  tag: tagSchema,
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

/** Path param :id */
export const NoteIdSchema = z.object({
  id: z.string().uuid('Note id must be a valid UUID'),
});
