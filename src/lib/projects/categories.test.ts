import { describe, expect, test } from "bun:test";
import {
  type CategoryProposal,
  type ClassifierVerdict,
  decideCategory,
  GRADUATION_THRESHOLD,
  graduatedProposalIds,
  resolveClusters,
  resolveProjectCluster,
} from "./categories";

const KNOWN = new Set(["personas", "recursos", "data"]);

function verdict(overrides: Partial<ClassifierVerdict>): ClassifierVerdict {
  return {
    fitsExisting: false,
    categoryId: null,
    confidence: 0,
    proposedId: null,
    proposedLabel: null,
    proposedDescription: null,
    ...overrides,
  };
}

describe("decideCategory", () => {
  test("assigns to an existing cluster above the confidence floor", () => {
    const decision = decideCategory(
      verdict({ fitsExisting: true, categoryId: "personas", confidence: 0.9 }),
      KNOWN,
    );
    expect(decision).toEqual({
      categoryId: "personas",
      status: "assigned",
      confidence: 0.9,
    });
  });

  test("falls back to other when confidence is too low and nothing proposed", () => {
    const decision = decideCategory(
      verdict({ fitsExisting: true, categoryId: "personas", confidence: 0.3 }),
      KNOWN,
    );
    expect(decision.categoryId).toBe("other");
    expect(decision.status).toBe("assigned");
  });

  test("ignores an existing-cluster verdict pointing at an unknown id", () => {
    const decision = decideCategory(
      verdict({ fitsExisting: true, categoryId: "made-up", confidence: 0.95 }),
      KNOWN,
    );
    expect(decision.categoryId).toBe("other");
  });

  test("records a proposed cluster when nothing fits", () => {
    const decision = decideCategory(
      verdict({
        proposedId: "mental-health",
        proposedLabel: "Mental Health",
        proposedDescription: "Psychological support after the quake.",
        confidence: 0.8,
      }),
      KNOWN,
    );
    expect(decision.status).toBe("proposed");
    expect(decision.categoryId).toBe("mental-health");
    expect(decision.proposal?.label).toBe("Mental Health");
  });
});

describe("graduation", () => {
  const proposals: CategoryProposal[] = [
    { id: "mental-health", label: "Mental Health", description: "" },
    { id: "legal-aid", label: "Legal Aid", description: "" },
  ];

  test("a proposal graduates only at the threshold", () => {
    const counts = new Map<string, number>([
      ["mental-health", GRADUATION_THRESHOLD],
      ["legal-aid", GRADUATION_THRESHOLD - 1],
    ]);
    const graduated = graduatedProposalIds(proposals, counts);
    expect(graduated.has("mental-health")).toBe(true);
    expect(graduated.has("legal-aid")).toBe(false);
  });

  test("resolveClusters surfaces built-ins plus graduated proposals only", () => {
    const counts = new Map<string, number>([
      ["mental-health", GRADUATION_THRESHOLD],
      ["legal-aid", 1],
    ]);
    const ids = resolveClusters(proposals, counts).map((c) => c.id);
    expect(ids).toContain("personas"); // built-in always present
    expect(ids).toContain("mental-health"); // graduated
    expect(ids).not.toContain("legal-aid"); // still pending
  });
});

describe("resolveProjectCluster", () => {
  const project = { slug: "x", name: "X", descriptionMarkdown: "" };

  test("keeps an assigned built-in", () => {
    expect(
      resolveProjectCluster(
        project,
        { categoryId: "personas", status: "assigned" },
        new Set(),
      ),
    ).toBe("personas");
  });

  test("downgrades a not-yet-graduated proposal to other", () => {
    expect(
      resolveProjectCluster(
        project,
        { categoryId: "legal-aid", status: "proposed" },
        new Set(),
      ),
    ).toBe("other");
  });

  test("shows a graduated proposal", () => {
    expect(
      resolveProjectCluster(
        project,
        { categoryId: "legal-aid", status: "proposed" },
        new Set(["legal-aid"]),
      ),
    ).toBe("legal-aid");
  });

  test("falls back to the keyword heuristic with no stored assignment", () => {
    expect(
      resolveProjectCluster(
        {
          slug: "y",
          name: "Buscador de desaparecidos",
          descriptionMarkdown: "Reunificar familias",
        },
        undefined,
        new Set(),
      ),
    ).toBe("personas");
  });
});
