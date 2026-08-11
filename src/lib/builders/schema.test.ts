import { describe, expect, test } from "bun:test";
import {
  builderProfileSchema,
  emptyAvailability,
  hasAvailability,
  normalizeAvailability,
  weeklyHours,
} from "./schema";

describe("builder availability", () => {
  test("treats all-zero availability as unset", () => {
    const availability = emptyAvailability();

    expect(weeklyHours(availability)).toBe(0);
    expect(hasAvailability(availability)).toBe(false);
  });

  test("treats positive hours as set availability", () => {
    const availability = normalizeAvailability({ saturday: 4 });

    expect(weeklyHours(availability)).toBe(4);
    expect(hasAvailability(availability)).toBe(true);
  });
});

describe("builder profile schema", () => {
  const validProfile = {
    name: "Ana Builder",
    role: "fullstack_engineer",
    description:
      "I can help ship useful civic tools with thoughtful product and engineering execution.",
    linkedinUrl: "",
    portfolioUrl: "",
    availabilityVisible: false,
    availability: emptyAvailability(),
  } as const;

  test("allows predefined roles without a custom role", () => {
    const parsed = builderProfileSchema.safeParse(validProfile);

    expect(parsed.success).toBe(true);
  });

  test("requires a custom role when role is other", () => {
    const parsed = builderProfileSchema.safeParse({
      ...validProfile,
      role: "other",
      customRole: "",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.customRole).toContain(
      "Describe your role.",
    );
  });

  test("accepts a described other role", () => {
    const parsed = builderProfileSchema.safeParse({
      ...validProfile,
      role: "other",
      customRole: "Community organizer",
    });

    expect(parsed.success).toBe(true);
  });
});
