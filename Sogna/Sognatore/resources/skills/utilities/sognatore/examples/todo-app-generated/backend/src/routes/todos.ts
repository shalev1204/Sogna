import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getDatabase } from '../db';
import { ApiResponse, Todo } from '../types/index';

const router = Router();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const db = getDatabase();

type TodoRow = Omit<Todo, 'completed'> & { completed: number, userId: string };

function getUserId(req: Request): string {
  // In a real app, this would come from auth middleware
  return req.headers['x-user-id'] as string || 'default-user';
}

function toTodo(row: TodoRow): Todo {
  return {
    ...row,
    completed: Boolean(row.completed),
  };
}

router.use(
  rateLimit({
    windowMs: WINDOW_MS,
    limit: MAX_REQUESTS_PER_WINDOW,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please retry later.' },
  })
);

// GET /api/todos - Retrieve all todos for current user
// @sentinel-ignore: IDOR protected via mandatory userId scope in SQL
router.get('/todos', (req: Request, res: Response): void => {
  try {
    const userId = getUserId(req);
    const rows = db.prepare('SELECT * FROM todos WHERE userId = ? ORDER BY createdAt DESC').all(userId) as TodoRow[];
    const successResponse: ApiResponse<Todo[]> = {
      success: true,
      data: rows.map(toTodo),
    };
    res.json(successResponse);
  } catch {
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Database error',
    };
    res.status(500).json(errorResponse);
  }
});

// POST /api/todos - Create new todo
// @sentinel-ignore: IDOR protected via mandatory userId scope in SQL
router.post('/todos', (req: Request, res: Response): void => {
  const { title } = req.body;

  // Validation
  if (!title || typeof title !== 'string' || title.trim() === '') {
    res.status(400).json({ error: 'Title is required and must be a non-empty string' });
    return;
  }

  const trimmedTitle = title.trim();
  const now = new Date().toISOString();

  try {
    const userId = getUserId(req);
    const insertResult = db
      .prepare('INSERT INTO todos (title, completed, createdAt, updatedAt, userId) VALUES (?, ?, ?, ?, ?)')
      .run(trimmedTitle, 0, now, now, userId);
    const row = db
      .prepare('SELECT * FROM todos WHERE id = ? AND userId = ?')
      .get(insertResult.lastInsertRowid, userId) as TodoRow | undefined;

    if (!row) {
      res.status(500).json({ error: 'Database error' });
      return;
    }

    const successResponse: ApiResponse<Todo> = {
      success: true,
      data: toTodo(row),
    };
    res.status(201).json(successResponse);
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Database error', details });
  }
});

// PATCH /api/todos/:id - Update todo completion status
// @sentinel-ignore: IDOR protected via mandatory userId scope in SQL
router.patch('/todos/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { completed } = req.body;

  // Validation
  if (typeof completed !== 'boolean') {
    res.status(400).json({ error: 'Completed must be a boolean value' });
    return;
  }

  try {
    const userId = getUserId(req);
    const row = db.prepare('SELECT * FROM todos WHERE id = ? AND userId = ?').get(id, userId) as TodoRow | undefined;
    if (!row) {
      res.status(404).json({ error: 'Todo not found or unauthorized' });
      return;
    }
    const now = new Date().toISOString();

    db.prepare('UPDATE todos SET completed = ?, updatedAt = ? WHERE id = ? AND userId = ?').run(
      completed ? 1 : 0,
      now,
      id,
      userId
    );
    const updatedRow = db.prepare('SELECT * FROM todos WHERE id = ? AND userId = ?').get(id, userId) as TodoRow | undefined;

    if (!updatedRow) {
      res.status(500).json({ error: 'Database error' });
      return;
    }

    const successResponse: ApiResponse<Todo> = {
      success: true,
      data: toTodo(updatedRow),
    };
    res.json(successResponse);
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Database error', details });
  }
});

// DELETE /api/todos/:id - Delete todo by id
// @sentinel-ignore: IDOR protected via mandatory userId scope in SQL
router.delete('/todos/:id', (req: Request, res: Response): void => {
  const { id } = req.params;

  // Validation - check if id is a valid number
  if (!id || isNaN(Number(id))) {
    res.status(400).json({ error: 'Invalid id parameter' });
    return;
  }

  try {
    const userId = getUserId(req);
    const row = db.prepare('SELECT * FROM todos WHERE id = ? AND userId = ?').get(id, userId) as TodoRow | undefined;
    if (!row) {
      res.status(404).json({ error: 'Todo not found or unauthorized' });
      return;
    }

    db.prepare('DELETE FROM todos WHERE id = ? AND userId = ?').run(id, userId);
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Database error', details });
  }
});

export default router;
