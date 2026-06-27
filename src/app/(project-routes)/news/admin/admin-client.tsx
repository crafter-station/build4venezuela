"use client";

import { useState } from "react";
import type { NewsAdminRole } from "@/lib/news/store";

type TabId = "breaking" | "factchecks" | "media" | "users";

export function AdminPanelClient({ role }: { role: NewsAdminRole }) {
  const [activeTab, setActiveTab] = useState<TabId>("breaking");

  const tabs: { id: TabId; label: string; roles: NewsAdminRole[] }[] = [
    { id: "breaking", label: "Última Hora", roles: ["staff", "editor"] },
    { id: "factchecks", label: "Fact-checks", roles: ["staff", "editor", "fact_checker"] },
    { id: "media", label: "Medios Verificados", roles: ["staff", "editor"] },
    { id: "users", label: "Usuarios", roles: ["staff"] },
  ];

  const visibleTabs = tabs.filter((t) => t.roles.includes(role));

  return (
    <div className="flex flex-col gap-8">
      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-px">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border border-b-0 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] transition ${
              activeTab === tab.id
                ? "border-border bg-card text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px] border border-border bg-card p-5 sm:p-8">
        {activeTab === "breaking" && (
          <div className="flex flex-col gap-6">
            <h2 className="font-mono text-lg font-black uppercase">Publicar Última Hora (Ticker)</h2>
            <p className="font-mono text-xs text-muted-foreground">
              Añade un mensaje corto al cintillo superior de la página de noticias.
            </p>
            <form className="flex flex-col gap-4 max-w-xl" onSubmit={(e) => e.preventDefault()}>
              <textarea 
                className="min-h-[100px] border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
                placeholder="Texto de la noticia..."
              />
              <select className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none">
                <option value="verified">Verificado (Verde)</option>
                <option value="unverified">En verificación (Amarillo)</option>
                <option value="debunked">Desmentido (Rojo)</option>
              </select>
              <button className="self-start border border-primary bg-primary/10 px-6 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-primary transition hover:bg-primary hover:text-background">
                Publicar
              </button>
            </form>
            <div className="mt-8 border-t border-border pt-6">
              <p className="font-mono text-xs text-muted-foreground">Lista de noticias activas (WIP: Conectar con API)...</p>
            </div>
          </div>
        )}

        {activeTab === "factchecks" && (
          <div className="flex flex-col gap-6">
            <h2 className="font-mono text-lg font-black uppercase">Registrar Fact-check</h2>
            <form className="flex flex-col gap-4 max-w-xl" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text"
                className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
                placeholder="Afirmación a desmentir (Ej: 'Hay un tsunami en curso...')"
              />
              <select className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none">
                <option value="false">Falso</option>
                <option value="misleading">Engañoso</option>
                <option value="unverified">Sin verificar</option>
              </select>
              <textarea 
                className="min-h-[100px] border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
                placeholder="Explicación detallada..."
              />
              <input 
                type="text"
                className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
                placeholder="Nombre de la fuente (Ej: Cazadores de Fake News)"
              />
              <input 
                type="url"
                className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
                placeholder="URL de la fuente (https://...)"
              />
              <button className="self-start border border-destructive/50 bg-destructive/10 px-6 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-destructive transition hover:bg-destructive hover:text-background">
                Guardar Fact-check
              </button>
            </form>
          </div>
        )}

        {activeTab === "media" && (
          <div className="flex flex-col gap-6">
            <h2 className="font-mono text-lg font-black uppercase">Medios Verificados (Whitelist)</h2>
            <p className="font-mono text-xs text-muted-foreground">
              Añade fuentes de confianza. Solo las fuentes en esta lista aparecerán en el timeline.
            </p>
            <form className="flex flex-col gap-4 max-w-xl" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text"
                className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
                placeholder="Nombre del medio (Ej: Efecto Cocuyo)"
              />
              <input 
                type="text"
                className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
                placeholder="Handle (Ej: @EfectoCocuyo)"
              />
              <select className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none">
                <option value="media">Medio de comunicación</option>
                <option value="official">Ente Oficial</option>
                <option value="ngo">ONG</option>
                <option value="international">Internacional</option>
              </select>
              <button className="self-start border border-foreground bg-foreground px-6 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-background transition hover:bg-foreground/80">
                Añadir Medio
              </button>
            </form>
          </div>
        )}

        {activeTab === "users" && (
          <div className="flex flex-col gap-6">
            <h2 className="font-mono text-lg font-black uppercase">Gestión de Roles (Staff)</h2>
            <form className="flex flex-col gap-4 max-w-xl" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text"
                className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
                placeholder="User ID de Clerk (Ej: user_2a...)"
              />
              <input 
                type="text"
                className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
                placeholder="Nombre a mostrar"
              />
              <select className="border border-border bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none">
                <option value="editor">Editor (Puede publicar noticias)</option>
                <option value="fact_checker">Fact Checker (Solo desmentidas)</option>
                <option value="staff">Staff (Acceso Total)</option>
              </select>
              <button className="self-start border border-accent bg-accent/10 px-6 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent transition hover:bg-accent hover:text-background">
                Asignar Rol
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
