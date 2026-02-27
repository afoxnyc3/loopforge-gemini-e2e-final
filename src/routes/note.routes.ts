import { Router } from 'express';
import { noteController } from '../controllers/note.controller';

const router = Router();

/**
 * IMPORTANT: /notes/search must be declared BEFORE /notes/:id
 * so Express matches the literal segment before the wildcard param.
 */

// Search by tag
router.get('/search', noteController.search);

// List all (with optional ?tag= filter)
router.get('/', noteController.list);

// Create
router.post('/', noteController.create);

// Get by id
router.get('/:id', noteController.getById);

// Update (partial)
router.patch('/:id', noteController.update);

// Delete
router.delete('/:id', noteController.delete);

export default router;
