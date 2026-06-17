import type { Request, Response, NextFunction } from "express";

/**
 * Token opcional para REST Delegate API (/api/*).
 * Si SOGNA_DELEGATE_API_TOKEN no está definido, no se exige auth (modo local IDE).
 */
export function requireDelegateApiToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const expected = process.env.SOGNA_DELEGATE_API_TOKEN?.trim();
  if (!expected) {
    next();
    return;
  }
  const header = req.headers.authorization;
  if (header === `Bearer ${expected}`) {
    next();
    return;
  }
  res.status(401).json({
    error: "Unauthorized — configure Authorization: Bearer <SOGNA_DELEGATE_API_TOKEN>",
  });
}
