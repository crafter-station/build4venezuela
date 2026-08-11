import { describe, expect, test } from "bun:test";
import type { ResolvedCluster } from "./categories";
import { localizeClusters } from "./localize-clusters";

describe("localizeClusters", () => {
  test("replaces built-in cluster copy with translated strings", () => {
    const clusters: ResolvedCluster[] = [
      {
        id: "personas",
        label: "Find People",
        title: "Missing & Found People",
        description: "English description",
        builtin: true,
      },
    ];

    const localized = localizeClusters(clusters, (key) => {
      if (key === "personas.label") return "Buscar personas";
      if (key === "personas.title") return "Personas desaparecidas";
      if (key === "personas.description") return "Descripción en español";
      return key;
    });

    expect(localized[0]).toEqual({
      id: "personas",
      label: "Buscar personas",
      title: "Personas desaparecidas",
      description: "Descripción en español",
      builtin: true,
    });
  });

  test("leaves graduated proposals unchanged", () => {
    const clusters: ResolvedCluster[] = [
      {
        id: "mental-health",
        label: "Mental Health",
        title: "Mental Health",
        description: "Psychological support.",
        builtin: false,
      },
    ];

    const localized = localizeClusters(clusters, () => "should-not-apply");

    expect(localized).toEqual(clusters);
  });
});
