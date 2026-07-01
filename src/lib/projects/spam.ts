import { gateway } from "@ai-sdk/gateway";
import { generateObject, zodSchema } from "ai";
import { z } from "zod";
import { env } from "@/env";
import type {
  BuilderContactRequestInput,
  BuilderProfileInput,
} from "@/lib/builders/schema";
import { logError } from "@/lib/log";
import type {
  SolutionRequestCommentInput,
  SolutionRequestInput,
} from "../requests/schema";
import type { ProjectCommentInput, ProjectFormInput } from "./schema";

const spamResultSchema = z.object({
  isSpam: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(500),
});

// Bound the gateway call so a slow/stalled LLM request can't hang the whole
// submit request until Vercel's 300s wall. On timeout the call rejects, the
// catch below runs, and the submission fails fast with a readable message.
const SPAM_CHECK_TIMEOUT_MS = 15_000;

export type SpamCheckResult = z.infer<typeof spamResultSchema> & {
  validationPassed: boolean;
};

export async function checkProjectForSpam(
  input: ProjectFormInput,
  spamValidationConfigured = Boolean(env.AI_GATEWAY_API_KEY),
): Promise<SpamCheckResult> {
  if (!spamValidationConfigured) {
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI Gateway is not configured.",
      validationPassed: false,
    };
  }

  try {
    const result = await generateObject({
      model: gateway("anthropic/claude-sonnet-4.6"),
      schema: zodSchema(spamResultSchema),
      abortSignal: AbortSignal.timeout(SPAM_CHECK_TIMEOUT_MS),
      system:
        "You review hackathon/community project submissions. Flag only clear spam, scams, unrelated ads, malicious links, gibberish, or abusive content. Do not reject legitimate rough drafts or early-stage civic projects.",
      prompt: JSON.stringify(
        {
          name: input.name,
          slug: input.slug,
          projectUrl: input.projectUrl,
          countries: input.countries,
          participantName: input.participantName,
          videoUrl: input.videoUrl,
          contributeInUrl: input.contributeInUrl,
          descriptionMarkdown: input.descriptionMarkdown,
        },
        null,
        2,
      ),
    });

    return { ...result.object, validationPassed: true };
  } catch (error) {
    logError("spam.project", error);
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI spam check failed. Please try again.",
      validationPassed: false,
    };
  }
}

export async function checkCommentForSpam(
  input: ProjectCommentInput,
  spamValidationConfigured = Boolean(env.AI_GATEWAY_API_KEY),
): Promise<SpamCheckResult> {
  if (!spamValidationConfigured) {
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI Gateway is not configured.",
      validationPassed: false,
    };
  }

  try {
    const result = await generateObject({
      model: gateway("anthropic/claude-sonnet-4.6"),
      schema: zodSchema(spamResultSchema),
      abortSignal: AbortSignal.timeout(SPAM_CHECK_TIMEOUT_MS),
      system:
        "You review comments on hackathon/community project submissions. Flag only clear spam, scams, unrelated ads, malicious links, gibberish, harassment, or abusive content. Do not reject concise legitimate feedback, questions, or criticism.",
      prompt: JSON.stringify({ body: input.body }, null, 2),
    });

    return { ...result.object, validationPassed: true };
  } catch (error) {
    logError("spam.projectComment", error);
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI spam check failed. Please try again.",
      validationPassed: false,
    };
  }
}

export async function checkSolutionRequestForSpam(
  input: SolutionRequestInput,
  spamValidationConfigured = Boolean(env.AI_GATEWAY_API_KEY),
): Promise<SpamCheckResult> {
  if (!spamValidationConfigured) {
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI Gateway is not configured.",
      validationPassed: false,
    };
  }

  try {
    const result = await generateObject({
      model: gateway("anthropic/claude-sonnet-4.6"),
      schema: zodSchema(spamResultSchema),
      abortSignal: AbortSignal.timeout(SPAM_CHECK_TIMEOUT_MS),
      system:
        "You review community solution requests. Flag only clear spam, scams, unrelated ads, malicious links, gibberish, harassment, or abusive content. Do not reject legitimate civic needs, rough drafts, urgent requests, or criticism.",
      prompt: JSON.stringify(
        {
          name: input.name,
          descriptionMarkdown: input.descriptionMarkdown,
        },
        null,
        2,
      ),
    });

    return { ...result.object, validationPassed: true };
  } catch (error) {
    logError("spam.request", error);
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI spam check failed. Please try again.",
      validationPassed: false,
    };
  }
}

export async function checkSolutionRequestCommentForSpam(
  input: SolutionRequestCommentInput,
  spamValidationConfigured = Boolean(env.AI_GATEWAY_API_KEY),
): Promise<SpamCheckResult> {
  if (!spamValidationConfigured) {
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI Gateway is not configured.",
      validationPassed: false,
    };
  }

  try {
    const result = await generateObject({
      model: gateway("anthropic/claude-sonnet-4.6"),
      schema: zodSchema(spamResultSchema),
      abortSignal: AbortSignal.timeout(SPAM_CHECK_TIMEOUT_MS),
      system:
        "You review comments on community solution requests. Flag only clear spam, scams, unrelated ads, malicious links, gibberish, harassment, or abusive content. Do not reject concise legitimate feedback, questions, support offers, or criticism.",
      prompt: JSON.stringify({ body: input.body }, null, 2),
    });

    return { ...result.object, validationPassed: true };
  } catch (error) {
    logError("spam.requestComment", error);
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI spam check failed. Please try again.",
      validationPassed: false,
    };
  }
}

export async function checkBuilderProfileForSpam(
  input: BuilderProfileInput,
  spamValidationConfigured = Boolean(env.AI_GATEWAY_API_KEY),
): Promise<SpamCheckResult> {
  if (!spamValidationConfigured) {
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI Gateway is not configured.",
      validationPassed: false,
    };
  }

  try {
    const result = await generateObject({
      model: gateway("anthropic/claude-sonnet-4.6"),
      schema: zodSchema(spamResultSchema),
      abortSignal: AbortSignal.timeout(SPAM_CHECK_TIMEOUT_MS),
      system:
        "You review builder profiles for a hackathon/community volunteer directory. Flag only clear spam, scams, unrelated ads, phishing, malicious links, gibberish, harassment, or abusive content. Do not reject legitimate skill descriptions, rough drafts, or early-career builders.",
      prompt: JSON.stringify(
        {
          name: input.name,
          role: input.role,
          customRole: input.customRole,
          description: input.description,
          linkedinUrl: input.linkedinUrl,
          portfolioUrl: input.portfolioUrl,
        },
        null,
        2,
      ),
    });

    return { ...result.object, validationPassed: true };
  } catch (error) {
    logError("spam.builderProfile", error);
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI spam check failed. Please try again.",
      validationPassed: false,
    };
  }
}

export async function checkBuilderContactRequestForSpam(
  input: Omit<BuilderContactRequestInput, "projectSlug">,
  spamValidationConfigured = Boolean(env.AI_GATEWAY_API_KEY),
): Promise<SpamCheckResult> {
  if (!spamValidationConfigured) {
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI Gateway is not configured.",
      validationPassed: false,
    };
  }

  try {
    const result = await generateObject({
      model: gateway("anthropic/claude-sonnet-4.6"),
      schema: zodSchema(spamResultSchema),
      abortSignal: AbortSignal.timeout(SPAM_CHECK_TIMEOUT_MS),
      system:
        "You review private contact requests from project owners to builders. Flag only clear spam, scams, unrelated ads, phishing, malicious links, gibberish, harassment, or abusive content. Do not reject concise legitimate collaboration requests, rough project context, or volunteer outreach.",
      prompt: JSON.stringify(
        {
          projectName: input.projectName,
          coverLetter: input.coverLetter,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
        },
        null,
        2,
      ),
    });

    return { ...result.object, validationPassed: true };
  } catch (error) {
    logError("spam.builderContactRequest", error);
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI spam check failed. Please try again.",
      validationPassed: false,
    };
  }
}
