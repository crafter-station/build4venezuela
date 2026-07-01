import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, desc, eq, ne, or } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { builderContactRequests, builderProfiles } from "@/db/schema";
import { logError } from "@/lib/log";
import {
  type BuilderContactRequest,
  type BuilderContactRequestInput,
  type BuilderProfile,
  type BuilderProfileInput,
  type BuilderRole,
  type BuilderStatus,
  type ContactRequestDirection,
  type ContactRequestStatus,
  hasAvailability,
  normalizeAvailability,
  weeklyHours,
} from "./schema";

type BuilderWrite = BuilderProfileInput & {
  userId: string;
  spamScore: number;
  spamReason: string;
};

type ContactRequestWrite = Omit<BuilderContactRequestInput, "projectSlug"> & {
  builderId: string;
  requesterUserId: string;
  requesterName: string;
  requesterImageUrl: string;
  spamScore: number;
  spamReason: string;
};

type LocalBuilderRow = {
  id: string;
  user_id: string;
  name: string;
  role: BuilderRole;
  custom_role?: string;
  description: string;
  linkedin_url: string;
  portfolio_url: string;
  availability_visible: boolean;
  availability: Record<string, number>;
  weekly_hours: number;
  status: BuilderStatus;
  directory_visible: boolean;
  created_at: string;
  updated_at: string;
};

type LocalContactRequestRow = {
  id: string;
  builder_id: string;
  requester_user_id: string;
  requester_name: string;
  requester_image_url: string;
  project_name: string;
  cover_letter: string;
  contact_email: string;
  contact_phone: string;
  status: ContactRequestStatus;
  spam_score: number | null;
  spam_reason: string | null;
  created_at: string;
  updated_at: string;
};

type LocalData = {
  builders: LocalBuilderRow[];
  contactRequests: LocalContactRequestRow[];
};

const localStorePath = path.join(process.cwd(), ".data", "builders.json");

function normalizeStoreError(error: unknown) {
  if (!(error instanceof Error) && typeof error !== "object") {
    return { message: String(error) };
  }

  const details = error as Record<string, unknown>;
  return {
    code: details.code,
    message: details.message,
    name: details.name,
  };
}

async function withLocalFallback<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>,
) {
  if (!isDbConfigured()) {
    return fallback();
  }

  try {
    return await operation();
  } catch (error) {
    logError("builder.store.fallback", error, {
      detail: normalizeStoreError(error),
    });
    return fallback();
  }
}

async function readLocalData(): Promise<LocalData> {
  try {
    const data = JSON.parse(
      await readFile(localStorePath, "utf8"),
    ) as Partial<LocalData>;
    return {
      builders: data.builders ?? [],
      contactRequests: data.contactRequests ?? [],
    };
  } catch {
    return { builders: [], contactRequests: [] };
  }
}

async function writeLocalData(data: LocalData) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, `${JSON.stringify(data, null, 2)}\n`);
}

function rowToBuilder(
  row: typeof builderProfiles.$inferSelect,
): BuilderProfile {
  return {
    id: row.id,
    name: row.name,
    role: row.role as BuilderRole,
    customRole: row.customRole,
    description: row.description,
    linkedinUrl: row.linkedinUrl,
    portfolioUrl: row.portfolioUrl,
    availabilityVisible: row.availabilityVisible,
    availability: row.availabilityVisible
      ? normalizeAvailability(row.availability)
      : normalizeAvailability(null),
    weeklyHours: row.availabilityVisible ? row.weeklyHours : 0,
    status: row.status as BuilderStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function localRowToBuilder(row: LocalBuilderRow): BuilderProfile {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    customRole: row.custom_role ?? "",
    description: row.description,
    linkedinUrl: row.linkedin_url,
    portfolioUrl: row.portfolio_url,
    availabilityVisible: row.availability_visible,
    availability: row.availability_visible
      ? normalizeAvailability(row.availability)
      : normalizeAvailability(null),
    weeklyHours: row.availability_visible ? row.weekly_hours : 0,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToContactRequest(
  row: typeof builderContactRequests.$inferSelect,
  builderName: string,
  direction: ContactRequestDirection = "inbound",
): BuilderContactRequest {
  return {
    id: row.id,
    direction,
    builderId: row.builderId,
    builderName,
    requesterName: row.requesterName,
    requesterImageUrl: row.requesterImageUrl,
    projectName: row.projectName,
    coverLetter: row.coverLetter,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    status: row.status as ContactRequestStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function localRowToContactRequest(
  row: LocalContactRequestRow,
  builderName: string,
  direction: ContactRequestDirection = "inbound",
): BuilderContactRequest {
  return {
    id: row.id,
    direction,
    builderId: row.builder_id,
    builderName,
    requesterName: row.requester_name,
    requesterImageUrl: row.requester_image_url,
    projectName: row.project_name,
    coverLetter: row.cover_letter,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBuilderValues(input: BuilderWrite) {
  const availability = normalizeAvailability(input.availability);
  const hours = weeklyHours(availability);
  const visible = input.availabilityVisible && hasAvailability(availability);

  return {
    userId: input.userId,
    name: input.name,
    role: input.role,
    customRole: input.role === "other" ? input.customRole.trim() : "",
    description: input.description,
    linkedinUrl: input.linkedinUrl,
    portfolioUrl: input.portfolioUrl,
    availabilityVisible: visible,
    availability: visible ? availability : normalizeAvailability(null),
    weeklyHours: visible ? hours : 0,
    status: "available",
    directoryVisible: true,
    spamScore: input.spamScore,
    spamReason: input.spamReason,
  };
}

function builderVisibilityValues(frozen: boolean) {
  return {
    status: frozen ? "busy" : "available",
    directoryVisible: !frozen,
  } satisfies {
    status: BuilderStatus;
    directoryVisible: boolean;
  };
}

export async function listPublicBuilders(excludedUserId?: string | null) {
  return withLocalFallback(
    async () => {
      const visibilityFilter = excludedUserId
        ? and(
            eq(builderProfiles.status, "available"),
            eq(builderProfiles.directoryVisible, true),
            ne(builderProfiles.userId, excludedUserId),
          )
        : and(
            eq(builderProfiles.status, "available"),
            eq(builderProfiles.directoryVisible, true),
          );
      const rows = await db
        .select()
        .from(builderProfiles)
        .where(visibilityFilter)
        .orderBy(
          desc(builderProfiles.weeklyHours),
          desc(builderProfiles.createdAt),
        );

      return rows.map(rowToBuilder);
    },
    async () => {
      const data = await readLocalData();
      return data.builders
        .filter(
          (builder) =>
            builder.status === "available" &&
            builder.directory_visible &&
            builder.user_id !== excludedUserId,
        )
        .sort(
          (a, b) =>
            b.weekly_hours - a.weekly_hours ||
            b.created_at.localeCompare(a.created_at),
        )
        .map(localRowToBuilder);
    },
  );
}

export async function getPublicBuilderById(builderId: string) {
  const builders = await listPublicBuilders();
  return builders.find((builder) => builder.id === builderId) ?? null;
}

export async function getBuilderByUserId(userId: string) {
  return withLocalFallback(
    async () => {
      const [row] = await db
        .select()
        .from(builderProfiles)
        .where(eq(builderProfiles.userId, userId))
        .limit(1);

      return row ? rowToBuilder(row) : null;
    },
    async () => {
      const data = await readLocalData();
      const row = data.builders.find((builder) => builder.user_id === userId);
      return row ? localRowToBuilder(row) : null;
    },
  );
}

export async function upsertBuilderProfile(input: BuilderWrite) {
  const values = toBuilderValues(input);

  return withLocalFallback(
    async () => {
      const [row] = await db
        .insert(builderProfiles)
        .values(values)
        .onConflictDoUpdate({
          target: builderProfiles.userId,
          set: {
            name: values.name,
            role: values.role,
            customRole: values.customRole,
            description: values.description,
            linkedinUrl: values.linkedinUrl,
            portfolioUrl: values.portfolioUrl,
            availabilityVisible: values.availabilityVisible,
            availability: values.availability,
            weeklyHours: values.weeklyHours,
            updatedAt: new Date(),
          },
        })
        .returning();

      return rowToBuilder(row);
    },
    async () => {
      const data = await readLocalData();
      const now = new Date().toISOString();
      const existingIndex = data.builders.findIndex(
        (builder) => builder.user_id === input.userId,
      );
      const localRow: LocalBuilderRow = {
        id: existingIndex >= 0 ? data.builders[existingIndex].id : randomUUID(),
        user_id: values.userId,
        name: values.name,
        role: values.role,
        custom_role: values.customRole,
        description: values.description,
        linkedin_url: values.linkedinUrl,
        portfolio_url: values.portfolioUrl,
        availability_visible: values.availabilityVisible,
        availability: values.availability,
        weekly_hours: values.weeklyHours,
        status:
          existingIndex >= 0
            ? data.builders[existingIndex].status
            : "available",
        directory_visible:
          existingIndex >= 0
            ? data.builders[existingIndex].directory_visible
            : true,
        created_at:
          existingIndex >= 0 ? data.builders[existingIndex].created_at : now,
        updated_at: now,
      };

      if (existingIndex >= 0) {
        data.builders[existingIndex] = localRow;
      } else {
        data.builders.unshift(localRow);
      }

      await writeLocalData(data);
      return localRowToBuilder(localRow);
    },
  );
}

export async function updateBuilderProfileVisibility(
  userId: string,
  frozen: boolean,
) {
  const visibility = builderVisibilityValues(frozen);

  return withLocalFallback(
    async () => {
      const [row] = await db
        .update(builderProfiles)
        .set({
          ...visibility,
          updatedAt: new Date(),
        })
        .where(eq(builderProfiles.userId, userId))
        .returning();

      if (!row) {
        throw new Error("Builder profile not found.");
      }

      return rowToBuilder(row);
    },
    async () => {
      const data = await readLocalData();
      const index = data.builders.findIndex(
        (builder) => builder.user_id === userId,
      );

      if (index === -1) {
        throw new Error("Builder profile not found.");
      }

      data.builders[index] = {
        ...data.builders[index],
        status: visibility.status,
        directory_visible: visibility.directoryVisible,
        updated_at: new Date().toISOString(),
      };

      await writeLocalData(data);
      return localRowToBuilder(data.builders[index]);
    },
  );
}

export async function deleteBuilderProfile(userId: string) {
  return withLocalFallback(
    async () => {
      const [row] = await db
        .delete(builderProfiles)
        .where(eq(builderProfiles.userId, userId))
        .returning({ id: builderProfiles.id });

      if (!row) {
        throw new Error("Builder profile not found.");
      }

      return row.id;
    },
    async () => {
      const data = await readLocalData();
      const builder = data.builders.find((item) => item.user_id === userId);

      if (!builder) {
        throw new Error("Builder profile not found.");
      }

      data.builders = data.builders.filter((item) => item.id !== builder.id);
      data.contactRequests = data.contactRequests.filter(
        (request) => request.builder_id !== builder.id,
      );

      await writeLocalData(data);
      return builder.id;
    },
  );
}

export async function createBuilderContactRequest(input: ContactRequestWrite) {
  return withLocalFallback(
    async () => {
      const [row] = await db
        .insert(builderContactRequests)
        .values({
          builderId: input.builderId,
          requesterUserId: input.requesterUserId,
          requesterName: input.requesterName,
          requesterImageUrl: input.requesterImageUrl,
          projectName: input.projectName,
          coverLetter: input.coverLetter,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          spamScore: input.spamScore,
          spamReason: input.spamReason,
        })
        .returning();

      const builder = await getPublicBuilderById(row.builderId);
      return rowToContactRequest(row, builder?.name ?? "Builder");
    },
    async () => {
      const data = await readLocalData();
      const now = new Date().toISOString();
      const row: LocalContactRequestRow = {
        id: randomUUID(),
        builder_id: input.builderId,
        requester_user_id: input.requesterUserId,
        requester_name: input.requesterName,
        requester_image_url: input.requesterImageUrl,
        project_name: input.projectName,
        cover_letter: input.coverLetter,
        contact_email: input.contactEmail,
        contact_phone: input.contactPhone,
        status: "pending",
        spam_score: input.spamScore,
        spam_reason: input.spamReason,
        created_at: now,
        updated_at: now,
      };

      data.contactRequests.unshift(row);
      await writeLocalData(data);

      const builder = data.builders.find((item) => item.id === input.builderId);
      return localRowToContactRequest(row, builder?.name ?? "Builder");
    },
  );
}

export async function listBuilderContactRequests(userId: string) {
  return withLocalFallback(
    async () => {
      const rows = await db
        .select({ request: builderContactRequests, builder: builderProfiles })
        .from(builderContactRequests)
        .innerJoin(
          builderProfiles,
          eq(builderProfiles.id, builderContactRequests.builderId),
        )
        .where(
          or(
            eq(builderProfiles.userId, userId),
            eq(builderContactRequests.requesterUserId, userId),
          ),
        )
        .orderBy(
          desc(builderContactRequests.createdAt),
          desc(builderContactRequests.updatedAt),
        );

      return rows.map((row) =>
        rowToContactRequest(
          row.request,
          row.builder.name,
          row.builder.userId === userId ? "inbound" : "outbound",
        ),
      );
    },
    async () => {
      const data = await readLocalData();
      const builderIds = new Set(
        data.builders
          .filter((builder) => builder.user_id === userId)
          .map((builder) => builder.id),
      );

      return data.contactRequests
        .filter(
          (request) =>
            builderIds.has(request.builder_id) ||
            request.requester_user_id === userId,
        )
        .sort(
          (a, b) =>
            b.created_at.localeCompare(a.created_at) ||
            b.updated_at.localeCompare(a.updated_at),
        )
        .map((request) => {
          const builder = data.builders.find(
            (item) => item.id === request.builder_id,
          );
          return localRowToContactRequest(
            request,
            builder?.name ?? "Builder",
            builder?.user_id === userId ? "inbound" : "outbound",
          );
        });
    },
  );
}

export async function updateBuilderContactRequestStatus(
  requestId: string,
  userId: string,
  status: Extract<ContactRequestStatus, "accepted" | "rejected">,
  hideProfile: boolean,
) {
  return withLocalFallback(
    async () => {
      const [owned] = await db
        .select({ request: builderContactRequests, builder: builderProfiles })
        .from(builderContactRequests)
        .innerJoin(
          builderProfiles,
          eq(builderProfiles.id, builderContactRequests.builderId),
        )
        .where(
          and(
            eq(builderContactRequests.id, requestId),
            eq(builderProfiles.userId, userId),
          ),
        )
        .limit(1);

      if (!owned) {
        throw new Error("Contact request not found.");
      }

      const [row] = await db
        .update(builderContactRequests)
        .set({ status, updatedAt: new Date() })
        .where(eq(builderContactRequests.id, requestId))
        .returning();

      if (status === "accepted" && hideProfile) {
        await db
          .update(builderProfiles)
          .set({
            status: "busy",
            directoryVisible: false,
            updatedAt: new Date(),
          })
          .where(eq(builderProfiles.id, owned.builder.id));
      }

      return rowToContactRequest(row, owned.builder.name);
    },
    async () => {
      const data = await readLocalData();
      const index = data.contactRequests.findIndex(
        (request) => request.id === requestId,
      );

      if (index === -1) {
        throw new Error("Contact request not found.");
      }

      const builderIndex = data.builders.findIndex(
        (builder) =>
          builder.id === data.contactRequests[index].builder_id &&
          builder.user_id === userId,
      );

      if (builderIndex === -1) {
        throw new Error("Contact request not found.");
      }

      data.contactRequests[index] = {
        ...data.contactRequests[index],
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "accepted" && hideProfile) {
        data.builders[builderIndex] = {
          ...data.builders[builderIndex],
          status: "busy",
          directory_visible: false,
          updated_at: new Date().toISOString(),
        };
      }

      await writeLocalData(data);
      return localRowToContactRequest(
        data.contactRequests[index],
        data.builders[builderIndex].name,
      );
    },
  );
}
