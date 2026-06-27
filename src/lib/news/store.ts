import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

// ─── Types ──────────────────────────────────────────────────────────

export type NewsAdminRole = "staff" | "editor" | "fact_checker";

export type NewsAdmin = {
  id: string;
  userId: string;
  displayName: string;
  role: NewsAdminRole;
  createdAt: string;
};

export type BreakingNewsRow = {
  id: string;
  text: string;
  confidence: "verified" | "unverified" | "debunked";
  pinned: boolean;
  author_user_id: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FactCheckRow = {
  id: string;
  claim: string;
  verdict: "false" | "misleading" | "unverified";
  explanation: string;
  source_url: string;
  source_name: string;
  author_user_id: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VerifiedSourceRow = {
  id: string;
  source_name: string;
  source_handle: string;
  source_url: string;
  category: "official" | "media" | "ngo" | "international";
  active: boolean;
  added_by_user_id: string;
  created_at: string;
  updated_at: string;
};

export type MediaEntryRow = {
  id: string;
  source_id: string | null;
  source_name: string;
  source_handle: string;
  content: string;
  url: string;
  confidence: "verified" | "unverified" | "debunked";
  author_user_id: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

// ─── Permission Matrix ──────────────────────────────────────────────

const permissions: Record<NewsAdminRole, Set<string>> = {
  staff: new Set([
    "manage_roles",
    "create_breaking",
    "edit_breaking",
    "publish_breaking",
    "delete_breaking",
    "create_factcheck",
    "edit_factcheck",
    "publish_factcheck",
    "delete_factcheck",
    "manage_sources",
    "create_media",
    "edit_media",
    "publish_media",
    "delete_media",
  ]),
  editor: new Set([
    "create_breaking",
    "edit_breaking",
    "publish_breaking",
    "create_factcheck",
    "edit_factcheck",
    "publish_factcheck",
    "manage_sources",
    "create_media",
    "edit_media",
    "publish_media",
  ]),
  fact_checker: new Set([
    "create_factcheck",
    "edit_factcheck",
    "create_media",
    "edit_media",
  ]),
};

export function hasPermission(role: NewsAdminRole, permission: string): boolean {
  return permissions[role]?.has(permission) ?? false;
}

// ─── Supabase Client ────────────────────────────────────────────────

function getSupabase() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Admin Role Helpers ─────────────────────────────────────────────

export async function getNewsAdmin(
  userId: string,
): Promise<NewsAdmin | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("news_admins")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      displayName: data.display_name,
      role: data.role as NewsAdminRole,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.warn("Failed to get news admin:", error);
    return null;
  }
}

export async function listNewsAdmins(): Promise<NewsAdmin[]> {
  const supabase = getSupabase();

  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("news_admins")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      role: row.role as NewsAdminRole,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.warn("Failed to list news admins:", error);
    return [];
  }
}

export async function upsertNewsAdmin(
  userId: string,
  displayName: string,
  role: NewsAdminRole,
): Promise<NewsAdmin | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("news_admins")
    .upsert(
      {
        user_id: userId,
        display_name: displayName,
        role,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    displayName: data.display_name,
    role: data.role as NewsAdminRole,
    createdAt: data.created_at,
  };
}

export async function removeNewsAdmin(userId: string): Promise<boolean> {
  const supabase = getSupabase();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("news_admins")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

// ─── Breaking News CRUD ─────────────────────────────────────────────

export async function listBreakingNews(publishedOnly = true) {
  const supabase = getSupabase();

  if (!supabase) {
    return [];
  }

  try {
    let query = supabase
      .from("news_breaking")
      .select("*")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (publishedOnly) {
      query = query.eq("published", true);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data ?? []) as BreakingNewsRow[];
  } catch (error) {
    console.warn("Failed to list breaking news:", error);
    return [];
  }
}

export async function createBreakingNews(
  input: Pick<BreakingNewsRow, "text" | "confidence" | "author_user_id"> & {
    publish?: boolean;
  },
) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("news_breaking")
    .insert({
      text: input.text,
      confidence: input.confidence,
      author_user_id: input.author_user_id,
      published: input.publish ?? false,
      published_at: input.publish ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as BreakingNewsRow;
}

// ─── Fact-Check CRUD ────────────────────────────────────────────────

export async function listFactChecks(publishedOnly = true) {
  const supabase = getSupabase();

  if (!supabase) {
    return [];
  }

  try {
    let query = supabase
      .from("news_factchecks")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (publishedOnly) {
      query = query.eq("published", true);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data ?? []) as FactCheckRow[];
  } catch (error) {
    console.warn("Failed to list factchecks:", error);
    return [];
  }
}

export async function createFactCheck(
  input: Pick<
    FactCheckRow,
    "claim" | "verdict" | "explanation" | "source_url" | "source_name" | "author_user_id"
  > & { publish?: boolean },
) {
  const supabase = getSupabase();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("news_factchecks")
    .insert({
      ...input,
      published: input.publish ?? false,
      published_at: input.publish ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as FactCheckRow;
}
