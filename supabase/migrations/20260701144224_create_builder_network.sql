
  create table "public"."builder_contact_requests" (
    "id" uuid not null default gen_random_uuid(),
    "builder_id" uuid not null,
    "requester_user_id" text not null,
    "requester_name" text not null default ''::text,
    "requester_image_url" text not null default ''::text,
    "project_name" text not null,
    "cover_letter" text not null,
    "contact_email" text not null default ''::text,
    "contact_phone" text not null default ''::text,
    "status" text not null default 'pending'::text,
    "spam_score" numeric,
    "spam_reason" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."builder_contact_requests" enable row level security;


  create table "public"."builder_profiles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" text not null,
    "name" text not null,
    "role" text not null,
    "custom_role" text not null default ''::text,
    "description" text not null,
    "linkedin_url" text not null default ''::text,
    "portfolio_url" text not null default ''::text,
    "availability_visible" boolean not null default false,
    "availability" jsonb not null default '{}'::jsonb,
    "weekly_hours" integer not null default 0,
    "status" text not null default 'available'::text,
    "directory_visible" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."builder_profiles" enable row level security;

CREATE INDEX builder_contact_requests_builder_id_idx ON public.builder_contact_requests USING btree (builder_id);

CREATE UNIQUE INDEX builder_contact_requests_pkey ON public.builder_contact_requests USING btree (id);

CREATE INDEX builder_contact_requests_requester_user_id_idx ON public.builder_contact_requests USING btree (requester_user_id);

CREATE INDEX builder_contact_requests_status_idx ON public.builder_contact_requests USING btree (status);

CREATE INDEX builder_profiles_directory_idx ON public.builder_profiles USING btree (status, directory_visible);

CREATE UNIQUE INDEX builder_profiles_pkey ON public.builder_profiles USING btree (id);

CREATE INDEX builder_profiles_role_idx ON public.builder_profiles USING btree (role);

CREATE INDEX builder_profiles_status_idx ON public.builder_profiles USING btree (status);

CREATE UNIQUE INDEX builder_profiles_user_id_key ON public.builder_profiles USING btree (user_id);

CREATE INDEX builder_profiles_weekly_hours_idx ON public.builder_profiles USING btree (weekly_hours);

alter table "public"."builder_contact_requests" add constraint "builder_contact_requests_pkey" PRIMARY KEY using index "builder_contact_requests_pkey";

alter table "public"."builder_profiles" add constraint "builder_profiles_pkey" PRIMARY KEY using index "builder_profiles_pkey";

alter table "public"."builder_contact_requests" add constraint "builder_contact_requests_builder_id_fkey" FOREIGN KEY (builder_id) REFERENCES public.builder_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."builder_contact_requests" validate constraint "builder_contact_requests_builder_id_fkey";

alter table "public"."builder_contact_requests" add constraint "builder_contact_requests_cover_letter_check" CHECK (((char_length(TRIM(BOTH FROM cover_letter)) >= 40) AND (char_length(TRIM(BOTH FROM cover_letter)) <= 2000))) not valid;

alter table "public"."builder_contact_requests" validate constraint "builder_contact_requests_cover_letter_check";

alter table "public"."builder_contact_requests" add constraint "builder_contact_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))) not valid;

alter table "public"."builder_contact_requests" validate constraint "builder_contact_requests_status_check";

alter table "public"."builder_profiles" add constraint "builder_profiles_description_check" CHECK (((char_length(TRIM(BOTH FROM description)) >= 40) AND (char_length(TRIM(BOTH FROM description)) <= 2000))) not valid;

alter table "public"."builder_profiles" validate constraint "builder_profiles_description_check";

alter table "public"."builder_profiles" add constraint "builder_profiles_custom_role_check" CHECK (((role <> 'other'::text) OR ((char_length(TRIM(BOTH FROM custom_role)) >= 2) AND (char_length(TRIM(BOTH FROM custom_role)) <= 80)))) not valid;

alter table "public"."builder_profiles" validate constraint "builder_profiles_custom_role_check";

alter table "public"."builder_profiles" add constraint "builder_profiles_role_check" CHECK ((role = ANY (ARRAY['frontend_engineer'::text, 'backend_engineer'::text, 'fullstack_engineer'::text, 'ai_engineer'::text, 'designer'::text, 'product_manager'::text, 'devops_engineer'::text, 'data_engineer'::text, 'other'::text]))) not valid;

alter table "public"."builder_profiles" validate constraint "builder_profiles_role_check";

alter table "public"."builder_profiles" add constraint "builder_profiles_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'busy'::text, 'hidden'::text]))) not valid;

alter table "public"."builder_profiles" validate constraint "builder_profiles_status_check";

alter table "public"."builder_profiles" add constraint "builder_profiles_user_id_key" UNIQUE using index "builder_profiles_user_id_key";

alter table "public"."builder_profiles" add constraint "builder_profiles_weekly_hours_check" CHECK (((weekly_hours >= 0) AND (weekly_hours <= 84))) not valid;

alter table "public"."builder_profiles" validate constraint "builder_profiles_weekly_hours_check";

grant references on table "public"."builder_contact_requests" to "anon";

grant trigger on table "public"."builder_contact_requests" to "anon";

grant truncate on table "public"."builder_contact_requests" to "anon";

grant references on table "public"."builder_contact_requests" to "authenticated";

grant trigger on table "public"."builder_contact_requests" to "authenticated";

grant truncate on table "public"."builder_contact_requests" to "authenticated";

grant references on table "public"."builder_contact_requests" to "service_role";

grant trigger on table "public"."builder_contact_requests" to "service_role";

grant truncate on table "public"."builder_contact_requests" to "service_role";

grant references on table "public"."builder_profiles" to "anon";

grant trigger on table "public"."builder_profiles" to "anon";

grant truncate on table "public"."builder_profiles" to "anon";

grant references on table "public"."builder_profiles" to "authenticated";

grant trigger on table "public"."builder_profiles" to "authenticated";

grant truncate on table "public"."builder_profiles" to "authenticated";

grant references on table "public"."builder_profiles" to "service_role";

grant trigger on table "public"."builder_profiles" to "service_role";

grant truncate on table "public"."builder_profiles" to "service_role";

CREATE TRIGGER builder_contact_requests_touch_updated_at BEFORE UPDATE ON public.builder_contact_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER builder_profiles_touch_updated_at BEFORE UPDATE ON public.builder_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

