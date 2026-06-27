import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProjectShell } from "../../project-shell";
import { getNewsAdmin } from "@/lib/news/store";
import { AdminPanelClient } from "./admin-client";

export const metadata = {
  title: "Admin Panel — VERIVE",
};

export default async function NewsAdminPage() {
  const { userId } = await auth();

  let admin = userId ? await getNewsAdmin(userId) : null;

  // HACKATHON DEMO: Si estamos en desarrollo y no hay admin (o no hay sesión),
  // inyectamos un usuario de prueba para poder previsualizar el panel
  // sin tener que correr la migración de Supabase de inmediato.
  if (!admin && process.env.NODE_ENV === "development") {
    admin = {
      id: "mock-admin",
      userId: userId || "mock-user",
      displayName: "Staff (Modo Demo)",
      role: "staff",
      createdAt: new Date().toISOString(),
    };
  }

  if (!admin) {
    return (
      <ProjectShell>
        <section className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center">
          <div className="border border-destructive/30 bg-destructive/10 p-8">
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center border border-destructive font-mono text-xl font-bold text-destructive">
              !
            </span>
            <h1 className="font-mono text-2xl font-black uppercase tracking-tight text-destructive">
              Acceso Denegado
            </h1>
            <p className="mt-2 font-mono text-sm font-light text-muted-foreground">
              No tienes permisos de administrador para el panel VERIVE.
            </p>
            <a
              href="/news"
              className="mt-6 inline-flex h-10 items-center justify-center border border-border px-4 font-mono text-xs font-bold uppercase tracking-[0.16em] transition hover:bg-card"
            >
              Volver a News
            </a>
          </div>
        </section>
      </ProjectShell>
    );
  }

  return (
    <ProjectShell>
      <section className="border-b border-border bg-card px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
              VERIVE Admin
            </p>
            <h1 className="font-mono text-3xl font-black uppercase tracking-[-0.02em]">
              Panel de Control
            </h1>
            <p className="font-mono text-sm uppercase tracking-[0.1em] text-muted-foreground">
              Bienvenido, <span className="font-bold text-foreground">{admin.displayName}</span> (Rol: {admin.role})
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <AdminPanelClient role={admin.role} />
        </div>
      </section>
    </ProjectShell>
  );
}
