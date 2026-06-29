import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Drizzle schema for the tables the app reads/writes directly.
 *
 * Source of truth for the database remains the raw SQL in `supabase/migrations`
 * — triggers, functions, RLS policies, the realtime event-queue tables, and
 * `gen_random_uuid()` defaults live there and are NOT modeled here. Treat this
 * file as the typed query surface; keep it in sync by hand (or `drizzle-kit
 * pull`) when migrations change. Do NOT `drizzle-kit push` against this DB — it
 * would not see the trigger/RLS objects and could drift destructively.
 */

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    status: text("status").notNull().default("published"),
    lifecycleStatus: text("lifecycle_status").notNull().default("ready_to_use"),
    projectUrl: text("project_url").notNull(),
    countries: text("countries").array().notNull().default(sql`'{}'`),
    participantName: text("participant_name").notNull(),
    videoUrl: text("video_url").notNull().default(""),
    contributeInUrl: text("contribute_in_url").notNull().default(""),
    descriptionMarkdown: text("description_markdown").notNull(),
    ownerUserId: text("owner_user_id").notNull(),
    ownerName: text("owner_name").notNull().default(""),
    ownerImageUrl: text("owner_image_url").notNull().default(""),
    spamScore: numeric("spam_score", { mode: "number" }),
    spamReason: text("spam_reason"),
    publishedAt: timestamp("published_at", { withTimezone: true }).default(
      sql`now()`,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("projects_slug_idx").on(table.slug),
    index("projects_created_at_idx").on(table.createdAt.desc()),
  ],
);

export const projectVotes = pgTable(
  "project_votes",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    voterId: text("voter_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.voterId] })],
);

export const projectComments = pgTable("project_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  authorUserId: text("author_user_id").notNull(),
  authorName: text("author_name").notNull(),
  authorImageUrl: text("author_image_url").notNull().default(""),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const projectCommentVotes = pgTable(
  "project_comment_votes",
  {
    commentId: uuid("comment_id")
      .notNull()
      .references(() => projectComments.id, { onDelete: "cascade" }),
    voterId: text("voter_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [primaryKey({ columns: [table.commentId, table.voterId] })],
);

export const categoryProposals = pgTable("category_proposals", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const projectCategories = pgTable(
  "project_categories",
  {
    projectId: uuid("project_id")
      .primaryKey()
      .references(() => projects.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    status: text("status").notNull().default("assigned"),
    confidence: numeric("confidence", { mode: "number" }),
    reasoning: text("reasoning"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [index("project_categories_category_id_idx").on(table.categoryId)],
);

export const projectInsights = pgTable(
  "project_insights",
  {
    projectId: uuid("project_id")
      .primaryKey()
      .references(() => projects.id, { onDelete: "cascade" }),

    // repo identity
    repoUrl: text("repo_url").notNull(),
    repoSourceField: text("repo_source_field"),
    repoAccessible: boolean("repo_accessible").notNull().default(true),

    // raw git/github signals
    stars: integer("stars"),
    forks: integer("forks"),
    contributors: integer("contributors"),
    commitCount: integer("commit_count"),
    codeLoc: integer("code_loc"),
    license: text("license"),
    repoCreatedAt: timestamp("repo_created_at", { withTimezone: true }),
    repoPushedAt: timestamp("repo_pushed_at", { withTimezone: true }),
    languages: jsonb("languages"),

    // technical analysis
    summary: text("summary"),
    projectType: text("project_type"),
    domainTags: text("domain_tags").array().notNull().default(sql`'{}'`),
    usesOrm: boolean("uses_orm"),
    ormOrDbLayer: text("orm_or_db_layer"),
    maturityScore: integer("maturity_score"),
    productionReadinessScore: integer("production_readiness_score"),
    codeOrganizationScore: integer("code_organization_score"),
    viabilityScore: integer("viability_score"),
    stack: jsonb("stack"),
    architecture: jsonb("architecture"),
    redFlags: text("red_flags").array().notNull().default(sql`'{}'`),
    analysis: jsonb("analysis"),

    // product evaluation
    solvesRealProblem: text("solves_real_problem"),
    problemSeverity: text("problem_severity"),
    impactPotential: integer("impact_potential"),
    productQuality: integer("product_quality"),
    diffusionScore: integer("diffusion_score"),
    diffusionReady: boolean("diffusion_ready"),
    liveDemoStatus: text("live_demo_status"),
    overallRecommendation: text("overall_recommendation"),
    oneLinePitch: text("one_line_pitch"),
    evaluation: jsonb("evaluation"),

    analyzedAt: timestamp("analyzed_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("project_insights_recommendation_idx").on(
      table.overallRecommendation,
    ),
    index("project_insights_viability_idx").on(table.viabilityScore.desc()),
  ],
);
