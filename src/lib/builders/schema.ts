import { z } from "zod";

export const builderRoles = [
  "frontend_engineer",
  "backend_engineer",
  "fullstack_engineer",
  "ai_engineer",
  "designer",
  "product_manager",
  "devops_engineer",
  "data_engineer",
  "other",
] as const;

export const builderStatuses = ["available", "busy", "hidden"] as const;
export const contactRequestStatuses = [
  "pending",
  "accepted",
  "rejected",
] as const;
export const contactRequestDirections = ["inbound", "outbound"] as const;

export const availabilityDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type BuilderRole = (typeof builderRoles)[number];
export type BuilderStatus = (typeof builderStatuses)[number];
export type ContactRequestStatus = (typeof contactRequestStatuses)[number];
export type ContactRequestDirection = (typeof contactRequestDirections)[number];
export type AvailabilityDay = (typeof availabilityDays)[number];
export type WeeklyAvailability = Record<AvailabilityDay, number>;

export type BuilderProfile = {
  id: string;
  name: string;
  role: BuilderRole;
  customRole: string;
  description: string;
  linkedinUrl: string;
  portfolioUrl: string;
  availabilityVisible: boolean;
  availability: WeeklyAvailability;
  weeklyHours: number;
  status: BuilderStatus;
  createdAt: string;
  updatedAt: string;
};

export type BuilderContactRequest = {
  id: string;
  direction: ContactRequestDirection;
  builderId: string;
  builderName: string;
  requesterName: string;
  requesterImageUrl: string;
  projectName: string;
  coverLetter: string;
  contactEmail: string;
  contactPhone: string;
  status: ContactRequestStatus;
  createdAt: string;
  updatedAt: string;
};

const optionalUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  }, "Enter a valid http(s) URL.");

const optionalEmailSchema = z
  .string()
  .trim()
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "Enter a valid email.",
  });

const availabilitySchema = z.object(
  Object.fromEntries(
    availabilityDays.map((day) => [
      day,
      z.coerce.number().int().min(0).max(12).default(0),
    ]),
  ) as Record<AvailabilityDay, z.ZodDefault<z.ZodCoercedNumber<number>>>,
);

export const builderProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required.").max(120),
    role: z.enum(builderRoles),
    customRole: z
      .string()
      .trim()
      .max(80, "Keep the role under 80 characters.")
      .default(""),
    description: z
      .string()
      .trim()
      .min(40, "Add a short builder description.")
      .max(2000, "Keep the description under 2,000 characters."),
    linkedinUrl: optionalUrlSchema,
    portfolioUrl: optionalUrlSchema,
    availabilityVisible: z.boolean().default(false),
    availability: availabilitySchema.default(emptyAvailability()),
  })
  .superRefine((value, context) => {
    if (value.role === "other" && value.customRole.length < 2) {
      context.addIssue({
        code: "custom",
        message: "Describe your role.",
        path: ["customRole"],
      });
    }
  });

export const builderContactRequestSchema = z.object({
  projectName: z.string().trim().min(2, "Project name is required.").max(160),
  coverLetter: z
    .string()
    .trim()
    .min(40, "Add a short note with useful context.")
    .max(2000, "Keep the note under 2,000 characters."),
  contactEmail: optionalEmailSchema,
  contactPhone: z.string().trim().max(80, "Keep the phone under 80 chars."),
  // Slug of one of the requester's own registered projects. When set, the
  // server verifies ownership and attaches the project's public info to the
  // note. Empty string means no project is attached.
  projectSlug: z.string().trim().max(200).default(""),
});

export type BuilderProfileInput = z.infer<typeof builderProfileSchema>;
export type BuilderContactRequestInput = z.infer<
  typeof builderContactRequestSchema
>;

export function emptyAvailability(): WeeklyAvailability {
  return {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  };
}

export function normalizeAvailability(
  value: Partial<Record<string, unknown>> | null | undefined,
): WeeklyAvailability {
  const empty = emptyAvailability();

  for (const day of availabilityDays) {
    const hours = Number(value?.[day] ?? 0);
    empty[day] = Number.isFinite(hours) ? Math.min(12, Math.max(0, hours)) : 0;
  }

  return empty;
}

export function weeklyHours(availability: WeeklyAvailability) {
  return availabilityDays.reduce((total, day) => total + availability[day], 0);
}

export function hasAvailability(availability: WeeklyAvailability) {
  return weeklyHours(availability) > 0;
}

export function roleLabel(role: BuilderRole) {
  return role
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function validationErrors(error: z.ZodError) {
  return Object.fromEntries(
    error.issues.map((issue) => [
      String(issue.path[0] ?? "form"),
      issue.message,
    ]),
  );
}
