import { gateway } from "@ai-sdk/gateway";
import { generateObject, zodSchema } from "ai";
import { z } from "zod";
import { env } from "@/env";
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
    console.error("Project spam check failed", error);
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
      system:
        "You review comments on hackathon/community project submissions. Flag only clear spam, scams, unrelated ads, malicious links, gibberish, harassment, or abusive content. Do not reject concise legitimate feedback, questions, or criticism.",
      prompt: JSON.stringify({ body: input.body }, null, 2),
    });

    return { ...result.object, validationPassed: true };
  } catch (error) {
    console.error("Project comment spam check failed", error);
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
    console.error("Solution request spam check failed", error);
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
      system:
        "You review comments on community solution requests. Flag only clear spam, scams, unrelated ads, malicious links, gibberish, harassment, or abusive content. Do not reject concise legitimate feedback, questions, support offers, or criticism.",
      prompt: JSON.stringify({ body: input.body }, null, 2),
    });

    return { ...result.object, validationPassed: true };
  } catch (error) {
    console.error("Solution request comment spam check failed", error);
    return {
      isSpam: false,
      confidence: 0,
      reason: "AI spam check failed. Please try again.",
      validationPassed: false,
    };
  }
}
