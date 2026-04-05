import { z } from "zod";

export interface Score {
  id: number;
  userId: string;
  score: number;
  scoreDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreFilters {
  userId?: string;
  minScore?: number;
  maxScore?: number;
  fromDate?: string;
  toDate?: string;
  limit: number;
  offset: number;
}

/**
 * Returns true only for calendar-valid dates (rejects 2026-02-30, 2026-13-01, etc.)
 */
function isValidCalendarDate(val: string): boolean {
  const [year, month, day] = val.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format")
  .refine(isValidCalendarDate, "Must be a valid calendar date");

export const CreateScoreSchema = z.object({
  userId: z.string().min(1, "userId cannot be empty").max(64, "userId must be 64 characters or fewer"),
  score: z.number().int("score must be an integer").nonnegative("score must be 0 or greater"),
  scoreDate: isoDate,
});

export const UpdateScoreSchema = z
  .object({
    score: z.number().int("score must be an integer").nonnegative("score must be 0 or greater").optional(),
    scoreDate: isoDate.optional(),
  })
  .refine((d) => d.score !== undefined || d.scoreDate !== undefined, {
    message: "At least one field (score or scoreDate) must be provided",
  });

export const ListScoresQuerySchema = z.object({
  userId: z.string().optional(),
  minScore: z.coerce.number().int().nonnegative().optional(),
  maxScore: z.coerce.number().int().nonnegative().optional(),
  fromDate: isoDate.optional(),
  toDate: isoDate.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type CreateScoreInput = z.infer<typeof CreateScoreSchema>;
export type UpdateScoreInput = z.infer<typeof UpdateScoreSchema>;
export type ListScoresQuery = z.infer<typeof ListScoresQuerySchema>;
