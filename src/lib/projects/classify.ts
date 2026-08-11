import { gateway } from "@ai-sdk/gateway";
import { generateObject, zodSchema } from "ai";
import { z } from "zod";
import { env } from "@/env";
import { logError } from "@/lib/log";
import {
  type CategoryProposal,
  type ClassifierVerdict,
  PROJECT_CATEGORIES,
} from "./categories";
import type { ProjectFormInput } from "./schema";

const classificationSchema = z.object({
  fitsExisting: z
    .boolean()
    .describe(
      "True if the project clearly belongs to one of the existing clusters.",
    ),
  categoryId: z
    .string()
    .nullable()
    .describe("The id of the chosen existing cluster, or null."),
  confidence: z.number().min(0).max(1),
  proposedId: z
    .string()
    .nullable()
    .describe(
      "Only when nothing fits: a short kebab-case id for the new cluster. Reuse a pending-proposal id verbatim if the project matches it.",
    ),
  proposedLabel: z
    .string()
    .max(28)
    .nullable()
    .describe(
      "Only when nothing fits: a short Title Case label, e.g. 'Mental Health'.",
    ),
  proposedDescription: z
    .string()
    .max(240)
    .nullable()
    .describe(
      "Only when nothing fits: one sentence on what the cluster is for.",
    ),
  reasoning: z.string().max(400),
});

export type ProjectClassification = ClassifierVerdict & {
  reasoning: string;
  validationPassed: boolean;
};

type ClassifyContext = {
  /** Pending (not-yet-graduated) proposals so the model can reuse, not dup. */
  pendingProposals?: CategoryProposal[];
  configured?: boolean;
};

// Bound the gateway call. Classification is best-effort (the caller swallows
// failures), so a timeout simply skips it instead of hanging the submit.
const CLASSIFY_TIMEOUT_MS = 15_000;

const FAILED: ProjectClassification = {
  fitsExisting: false,
  categoryId: null,
  confidence: 0,
  proposedId: null,
  proposedLabel: null,
  proposedDescription: null,
  reasoning: "AI Gateway is not configured.",
  validationPassed: false,
};

export async function classifyProject(
  input: ProjectFormInput,
  context: ClassifyContext = {},
): Promise<ProjectClassification> {
  const configured = context.configured ?? Boolean(env.AI_GATEWAY_API_KEY);

  if (!configured) {
    return FAILED;
  }

  const existingClusters = PROJECT_CATEGORIES.filter(
    (category) => category.id !== "other",
  ).map((category) => ({
    id: category.id,
    label: category.label,
    description: category.description,
  }));

  const pendingProposals = (context.pendingProposals ?? []).map((proposal) => ({
    id: proposal.id,
    label: proposal.label,
    description: proposal.description,
  }));

  try {
    const result = await generateObject({
      model: gateway("anthropic/claude-sonnet-4.6"),
      schema: zodSchema(classificationSchema),
      abortSignal: AbortSignal.timeout(CLASSIFY_TIMEOUT_MS),
      system:
        "You classify civic/humanitarian hackathon projects into thematic clusters. " +
        "Strongly prefer assigning to an existing cluster. Only propose a NEW cluster when the project's core purpose genuinely matches none of them — not merely because it has an extra feature. " +
        "If a pending proposal already captures the theme, reuse its id verbatim instead of inventing a near-duplicate. " +
        "Keep proposed clusters broad enough to hold many projects.",
      prompt: JSON.stringify(
        {
          project: {
            name: input.name,
            descriptionMarkdown: input.descriptionMarkdown,
            projectUrl: input.projectUrl,
          },
          existingClusters,
          pendingProposals,
        },
        null,
        2,
      ),
    });

    return { ...result.object, validationPassed: true };
  } catch (error) {
    logError("classify.project", error);
    return { ...FAILED, reasoning: "AI classification failed." };
  }
}
