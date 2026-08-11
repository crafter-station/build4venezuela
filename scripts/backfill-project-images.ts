import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import postgres from "postgres";

type ProjectRow = {
  id: string;
  slug: string;
  project_url: string;
};

const databaseUrl = process.env.DATABASE_URL;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

if (!databaseUrl || !blobToken) {
  throw new Error("DATABASE_URL and BLOB_READ_WRITE_TOKEN are required.");
}

const outputDirectory = path.join(
  process.env.TMPDIR ?? "/tmp",
  "build4venezuela-project-images",
);
const sql = postgres(databaseUrl, { max: 4 });

async function browser(session: string, ...args: string[]) {
  const process = Bun.spawn(["agent-browser", "--session", session, ...args], {
    env: { ...Bun.env, AGENT_BROWSER_SCREENSHOT_FORMAT: "jpeg" },
    stderr: "pipe",
    stdout: "pipe",
  });
  const [exitCode, stderr] = await Promise.all([
    process.exited,
    new Response(process.stderr).text(),
  ]);

  if (exitCode !== 0) {
    throw new Error(stderr.trim() || `agent-browser ${args[0]} failed`);
  }
}

async function captureAndStore(project: ProjectRow, session: string) {
  const screenshotPath = path.join(outputDirectory, `${project.slug}.jpg`);

  await browser(session, "open", project.project_url);
  await browser(session, "wait", "2500");
  await browser(session, "screenshot", screenshotPath);

  const image = Bun.file(screenshotPath);
  const blob = await put(`project-images/backfill/${project.slug}.jpg`, image, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/jpeg",
    token: blobToken,
  });

  await sql`
    update projects
    set image_url = ${blob.url}, updated_at = now()
    where id = ${project.id} and video_url = '' and image_url = ''
  `;

  await rm(screenshotPath, { force: true });
}

await mkdir(outputDirectory, { recursive: true });

const projects = await sql<ProjectRow[]>`
  select id, slug, project_url
  from projects
  where status = 'published' and video_url = '' and image_url = ''
  order by created_at
`;

let nextProject = 0;
const failures: Array<{ slug: string; reason: string }> = [];
const workerCount = Math.min(4, projects.length);

await Promise.all(
  Array.from({ length: workerCount }, async (_, index) => {
    const session = `project-image-backfill-${index + 1}`;
    await browser(session, "set", "viewport", "1440", "900");

    while (nextProject < projects.length) {
      const project = projects[nextProject++];

      try {
        await captureAndStore(project, session);
        console.log(`Stored ${project.slug}`);
      } catch (error) {
        failures.push({
          slug: project.slug,
          reason: error instanceof Error ? error.message : String(error),
        });
        console.error(`Failed ${project.slug}`);
      }
    }

    await browser(session, "close").catch(() => {});
  }),
);

await sql.end();

console.log(
  JSON.stringify(
    {
      attempted: projects.length,
      stored: projects.length - failures.length,
      failures,
    },
    null,
    2,
  ),
);
