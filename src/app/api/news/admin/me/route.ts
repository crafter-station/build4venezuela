import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getNewsAdmin,
  hasPermission,
} from "@/lib/news/store";

// GET /api/news/admin/me — Get current user's admin role and permissions
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await getNewsAdmin(userId);

  if (!admin) {
    return NextResponse.json({
      isAdmin: false,
      role: null,
      permissions: [],
    });
  }

  // Build list of granted permissions
  const allPermissions = [
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
  ];

  const granted = allPermissions.filter((perm) =>
    hasPermission(admin.role, perm),
  );

  return NextResponse.json({
    isAdmin: true,
    role: admin.role,
    displayName: admin.displayName,
    permissions: granted,
  });
}
