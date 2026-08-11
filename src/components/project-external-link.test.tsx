import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectExternalLink } from "./project-external-link";

describe("ProjectExternalLink", () => {
  test("sends referrer traffic to live projects while isolating the new tab", () => {
    const markup = renderToStaticMarkup(
      <ProjectExternalLink href="https://project.example" sendReferrer>
        Open project
      </ProjectExternalLink>,
    );

    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener"');
    expect(markup).not.toContain("noreferrer");
  });

  test("suppresses referrer traffic by default", () => {
    const markup = renderToStaticMarkup(
      <ProjectExternalLink href="https://github.com/example/project">
        Repository
      </ProjectExternalLink>,
    );

    expect(markup).toContain('rel="noopener noreferrer"');
  });
});
