CREATE TABLE "builder_contact_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"builder_id" uuid NOT NULL,
	"requester_user_id" text NOT NULL,
	"requester_name" text DEFAULT '' NOT NULL,
	"requester_image_url" text DEFAULT '' NOT NULL,
	"project_name" text NOT NULL,
	"cover_letter" text NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"contact_phone" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"spam_score" numeric,
	"spam_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "builder_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"custom_role" text DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"linkedin_url" text DEFAULT '' NOT NULL,
	"portfolio_url" text DEFAULT '' NOT NULL,
	"availability_visible" boolean DEFAULT false NOT NULL,
	"availability" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"weekly_hours" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"directory_visible" boolean DEFAULT true NOT NULL,
	"spam_score" numeric,
	"spam_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "builder_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "category_proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_categories" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"confidence" numeric,
	"reasoning" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_comment_votes" (
	"comment_id" uuid NOT NULL,
	"voter_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_comment_votes_comment_id_voter_id_pk" PRIMARY KEY("comment_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE "project_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_image_url" text DEFAULT '' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_insights" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"repo_url" text NOT NULL,
	"repo_source_field" text,
	"repo_accessible" boolean DEFAULT true NOT NULL,
	"stars" integer,
	"forks" integer,
	"contributors" integer,
	"commit_count" integer,
	"code_loc" integer,
	"license" text,
	"repo_created_at" timestamp with time zone,
	"repo_pushed_at" timestamp with time zone,
	"languages" jsonb,
	"summary" text,
	"project_type" text,
	"domain_tags" text[] DEFAULT '{}' NOT NULL,
	"uses_orm" boolean,
	"orm_or_db_layer" text,
	"maturity_score" integer,
	"production_readiness_score" integer,
	"code_organization_score" integer,
	"viability_score" integer,
	"stack" jsonb,
	"architecture" jsonb,
	"red_flags" text[] DEFAULT '{}' NOT NULL,
	"analysis" jsonb,
	"solves_real_problem" text,
	"problem_severity" text,
	"impact_potential" integer,
	"product_quality" integer,
	"diffusion_score" integer,
	"diffusion_ready" boolean,
	"live_demo_status" text,
	"overall_recommendation" text,
	"one_line_pitch" text,
	"evaluation" jsonb,
	"analyzed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_votes" (
	"project_id" uuid NOT NULL,
	"voter_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_votes_project_id_voter_id_pk" PRIMARY KEY("project_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"lifecycle_status" text DEFAULT 'ready_to_use' NOT NULL,
	"applicability" text DEFAULT 'latam' NOT NULL,
	"project_url" text NOT NULL,
	"countries" text[] DEFAULT '{}' NOT NULL,
	"participant_name" text NOT NULL,
	"video_url" text DEFAULT '' NOT NULL,
	"contribute_in_url" text DEFAULT '' NOT NULL,
	"description_markdown" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"owner_name" text DEFAULT '' NOT NULL,
	"owner_image_url" text DEFAULT '' NOT NULL,
	"spam_score" numeric,
	"spam_reason" text,
	"published_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "solution_request_comment_votes" (
	"comment_id" uuid NOT NULL,
	"voter_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "solution_request_comment_votes_comment_id_voter_id_pk" PRIMARY KEY("comment_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE "solution_request_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_image_url" text DEFAULT '' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solution_request_votes" (
	"request_id" uuid NOT NULL,
	"voter_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "solution_request_votes_request_id_voter_id_pk" PRIMARY KEY("request_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE "solution_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description_markdown" text DEFAULT '' NOT NULL,
	"author_user_id" text NOT NULL,
	"author_name" text NOT NULL,
	"author_image_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "builder_contact_requests" ADD CONSTRAINT "builder_contact_requests_builder_id_builder_profiles_id_fk" FOREIGN KEY ("builder_id") REFERENCES "public"."builder_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_categories" ADD CONSTRAINT "project_categories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_comment_votes" ADD CONSTRAINT "project_comment_votes_comment_id_project_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."project_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_insights" ADD CONSTRAINT "project_insights_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_votes" ADD CONSTRAINT "project_votes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solution_request_comment_votes" ADD CONSTRAINT "solution_request_comment_votes_comment_id_solution_request_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."solution_request_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solution_request_comments" ADD CONSTRAINT "solution_request_comments_request_id_solution_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."solution_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solution_request_votes" ADD CONSTRAINT "solution_request_votes_request_id_solution_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."solution_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "builder_contact_requests_builder_id_idx" ON "builder_contact_requests" USING btree ("builder_id");--> statement-breakpoint
CREATE INDEX "builder_contact_requests_requester_user_id_idx" ON "builder_contact_requests" USING btree ("requester_user_id");--> statement-breakpoint
CREATE INDEX "builder_contact_requests_status_idx" ON "builder_contact_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "builder_profiles_role_idx" ON "builder_profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "builder_profiles_status_idx" ON "builder_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "builder_profiles_weekly_hours_idx" ON "builder_profiles" USING btree ("weekly_hours");--> statement-breakpoint
CREATE INDEX "project_categories_category_id_idx" ON "project_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "project_insights_recommendation_idx" ON "project_insights" USING btree ("overall_recommendation");--> statement-breakpoint
CREATE INDEX "project_insights_viability_idx" ON "project_insights" USING btree ("viability_score" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at" DESC NULLS LAST);