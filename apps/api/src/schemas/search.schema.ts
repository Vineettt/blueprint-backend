import { z } from 'zod';
import { ilike, SQL } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

export const searchSchema = z
  .string()
  .min(2, 'Search term must be at least 2 characters')
  .max(100, 'Search term too long')
  .transform(val => val.trim())
  .transform(val => val.replace(/[<>"'%;()&+]/g, ''))
  .transform(search => ({
    original: search,
    pattern: `%${search}%`,
  }));

export class SearchValidator {
  /**
   * Validates a search term and returns a drizzle `ilike` condition, or null if invalid/empty.
   * Use this for type-safe ORM queries.
   */
  static createIlikeCondition(
    column: PgColumn,
    searchTerm: string,
    schema: z.ZodType = searchSchema
  ): SQL | null {
    const result = schema.safeParse(searchTerm);
    if (!result.success) return null;

    const data = result.data as { original: string; pattern: string };
    return ilike(column, data.pattern);
  }

  /**
   * Validates a search term and returns `{ original, pattern }`, or null if invalid/empty.
   * Use `pattern` directly in raw SQL `ILIKE` expressions.
   */
  static validateSearch(
    searchTerm: string,
    schema: z.ZodType = searchSchema
  ): { original: string; pattern: string } | null {
    if (!searchTerm?.trim()) return null;
    const result = schema.safeParse(searchTerm);
    return result.success ? (result.data as { original: string; pattern: string }) : null;
  }
}
