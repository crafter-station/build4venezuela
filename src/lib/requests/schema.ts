import { z } from "zod";

export type SolutionRequest = {
  id: string;
  name: string;
  descriptionMarkdown: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  votesCount: number;
  voted: boolean;
  comments: SolutionRequestComment[];
};

export type SolutionRequestComment = {
  id: string;
  requestId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  votesCount: number;
  voted: boolean;
};

export const solutionRequestSchema = z.object({
  name: z.string().trim().min(3, "Add at least 3 characters.").max(140),
  descriptionMarkdown: z
    .string()
    .trim()
    .max(8000, "Keep the description under 8,000 characters."),
});

export const solutionRequestCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(3, "Add at least 3 characters.")
    .max(1200, "Keep comments under 1,200 characters."),
});

export type SolutionRequestInput = z.infer<typeof solutionRequestSchema>;
export type SolutionRequestCommentInput = z.infer<
  typeof solutionRequestCommentSchema
>;

export function sortSolutionRequestComments(
  comments: SolutionRequestComment[],
) {
  return [...comments].sort(
    (a, b) =>
      b.votesCount - a.votesCount || a.createdAt.localeCompare(b.createdAt),
  );
}

export function sortSolutionRequests(requests: SolutionRequest[]) {
  return [...requests].sort(
    (a, b) =>
      b.votesCount - a.votesCount || b.createdAt.localeCompare(a.createdAt),
  );
}

export function validationErrors(error: z.ZodError) {
  return Object.fromEntries(
    error.issues.map((issue) => [
      String(issue.path[0] ?? "form"),
      issue.message,
    ]),
  );
}
