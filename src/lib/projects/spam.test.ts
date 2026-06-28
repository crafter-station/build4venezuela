import { expect, test } from "bun:test";

process.env.AI_GATEWAY_API_KEY = "test-ai-gateway-key";
process.env.CLERK_SECRET_KEY = "test-clerk-secret-key";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test-clerk-publishable-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-supabase-service-role-key";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-supabase-anon-key";
process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-upstash-token";

const validProject = {
  slug: "civic-dashboard",
  name: "Civic Dashboard",
  projectUrl: "https://example.com",
  countries: "Venezuela",
  participantName: "Build Team",
  videoUrl: "https://youtube.com/watch?v=abc12345678",
  contributeInUrl: "https://github.com/example/civic-dashboard",
  descriptionMarkdown:
    "A civic dashboard that helps organizers track community needs, coordinate volunteers, and publish transparent progress updates for local recovery projects.",
};

test("spam validation fails closed when AI Gateway API key is missing", async () => {
  const { checkProjectForSpam } = await import("./spam");

  await expect(checkProjectForSpam(validProject, false)).resolves.toEqual({
    isSpam: false,
    confidence: 0,
    reason: "AI Gateway is not configured.",
    validationPassed: false,
  });
});

test("comment spam validation fails closed when AI Gateway API key is missing", async () => {
  const { checkCommentForSpam } = await import("./spam");

  await expect(
    checkCommentForSpam(
      { body: "This project could use clearer onboarding." },
      false,
    ),
  ).resolves.toEqual({
    isSpam: false,
    confidence: 0,
    reason: "AI Gateway is not configured.",
    validationPassed: false,
  });
});

test("solution request spam validation fails closed when AI Gateway API key is missing", async () => {
  const { checkSolutionRequestForSpam } = await import("./spam");

  await expect(
    checkSolutionRequestForSpam(
      {
        name: "Emergency supply coordination",
        descriptionMarkdown:
          "We need a lightweight tool for matching verified supply requests with local volunteer teams and publishing fulfillment status.",
      },
      false,
    ),
  ).resolves.toEqual({
    isSpam: false,
    confidence: 0,
    reason: "AI Gateway is not configured.",
    validationPassed: false,
  });
});

test("solution request comment spam validation fails closed when AI Gateway API key is missing", async () => {
  const { checkSolutionRequestCommentForSpam } = await import("./spam");

  await expect(
    checkSolutionRequestCommentForSpam(
      { body: "I can help scope this with local organizers." },
      false,
    ),
  ).resolves.toEqual({
    isSpam: false,
    confidence: 0,
    reason: "AI Gateway is not configured.",
    validationPassed: false,
  });
});
