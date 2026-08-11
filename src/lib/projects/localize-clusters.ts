import type { ResolvedCluster } from "./categories";

type CategoryTranslator = (key: string) => string;

/** Apply locale strings to built-in clusters; graduated proposals stay as stored. */
export function localizeClusters(
  clusters: ResolvedCluster[],
  t: CategoryTranslator,
): ResolvedCluster[] {
  return clusters.map((cluster) => {
    if (!cluster.builtin) {
      return cluster;
    }

    return {
      ...cluster,
      label: t(`${cluster.id}.label`),
      title: t(`${cluster.id}.title`),
      description: t(`${cluster.id}.description`),
    };
  });
}
