import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  type NewsAdminRole,
  getNewsAdmin,
  hasPermission,
  listNewsAdmins,
  removeNewsAdmin,
  upsertNewsAdmin,
} from "@/lib/news/store";

// GET /api/news/admin — List all admins (staff only)
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caller = await getNewsAdmin(userId);

  if (!caller || !hasPermission(caller.role, "manage_roles")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admins = await listNewsAdmins();
  return NextResponse.json({ admins });
}

// POST /api/news/admin — Create or update an admin role
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caller = await getNewsAdmin(userId);

  if (!caller || !hasPermission(caller.role, "manage_roles")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    targetUserId: string;
    displayName: string;
    role: NewsAdminRole;
  };

  if (!body.targetUserId || !body.displayName || !body.role) {
    return NextResponse.json(
      { error: "Missing required fields: targetUserId, displayName, role" },
      { status: 400 },
    );
  }

  if (!["staff", "editor", "fact_checker"].includes(body.role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be: staff, editor, or fact_checker" },
      { status: 400 },
    );
  }

  try {
    const admin = await upsertNewsAdmin(
      body.targetUserId,
      body.displayName,
      body.role,
    );
    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Failed to upsert news admin:", error);
    return NextResponse.json(
      { error: "Failed to update admin" },
      { status: 500 },
    );
  }
}

// DELETE /api/news/admin — Remove an admin
export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caller = await getNewsAdmin(userId);

  if (!caller || !hasPermission(caller.role, "manage_roles")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId");

  if (!targetUserId) {
    return NextResponse.json(
      { error: "Missing userId parameter" },
      { status: 400 },
    );
  }

  // Prevent self-removal
  if (targetUserId === userId) {
    return NextResponse.json(
      { error: "Cannot remove yourself" },
      { status: 400 },
    );
  }

  try {
    await removeNewsAdmin(targetUserId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove news admin:", error);
    return NextResponse.json(
      { error: "Failed to remove admin" },
      { status: 500 },
    );
  }
}
