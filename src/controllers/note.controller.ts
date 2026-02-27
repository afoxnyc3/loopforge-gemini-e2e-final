import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { noteService, NoteService } from '../services/note.service';
import {
  CreateNoteSchema,
  UpdateNoteSchema,
  ListNotesQuerySchema,
  SearchQuerySchema,
  NoteIdSchema,
} from '../models/note.model';
import { ValidationError } from '../errors/app.errors';

/**
 * Converts a ZodError into a structured ValidationError.
 */
function toValidationError(err: ZodError): ValidationError {
  const details = err.errors.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));
  return new ValidationError('Request validation failed', details);
}

export class NoteController {
  constructor(private readonly service: NoteService) {}

  /** POST /notes */
  create = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = CreateNoteSchema.safeParse(req.body);
      if (!result.success) return void next(toValidationError(result.error));
      const note = this.service.create(result.data);
      res.status(201).json(note);
    } catch (err) {
      next(err);
    }
  };

  /** GET /notes */
  list = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = ListNotesQuerySchema.safeParse(req.query);
      if (!result.success) return void next(toValidationError(result.error));
      const notes = this.service.list(result.data.tag);
      res.status(200).json(notes);
    } catch (err) {
      next(err);
    }
  };

  /** GET /notes/:id */
  getById = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = NoteIdSchema.safeParse(req.params);
      if (!result.success) return void next(toValidationError(result.error));
      const note = this.service.getById(result.data.id);
      res.status(200).json(note);
    } catch (err) {
      next(err);
    }
  };

  /** PATCH /notes/:id */
  update = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const idResult = NoteIdSchema.safeParse(req.params);
      if (!idResult.success) return void next(toValidationError(idResult.error));

      const bodyResult = UpdateNoteSchema.safeParse(req.body);
      if (!bodyResult.success) return void next(toValidationError(bodyResult.error));

      const note = this.service.update(idResult.data.id, bodyResult.data);
      res.status(200).json(note);
    } catch (err) {
      next(err);
    }
  };

  /** DELETE /notes/:id */
  delete = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = NoteIdSchema.safeParse(req.params);
      if (!result.success) return void next(toValidationError(result.error));
      this.service.delete(result.data.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  /** GET /notes/search?tag=... */
  search = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = SearchQuerySchema.safeParse(req.query);
      if (!result.success) return void next(toValidationError(result.error));
      const notes = this.service.searchByTag(result.data.tag);
      res.status(200).json(notes);
    } catch (err) {
      next(err);
    }
  };
}

/** Singleton controller instance. */
export const noteController = new NoteController(noteService);
