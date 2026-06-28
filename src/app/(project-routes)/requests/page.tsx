import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { listSolutionRequests } from "@/lib/requests/store";
import { ProjectShell } from "../project-shell";
import { RequestsBoard } from "./requests-board";

export const metadata: Metadata = {
  title: "Requests for solutions | Build4Venezuela",
  description:
    "A live board where people in Venezuela can request useful solutions, vote, and discuss what builders should make next.",
};

export default async function RequestsPage() {
  const { userId } = await auth();
  const requests = await listSolutionRequests(userId ?? undefined);

  return (
    <ProjectShell>
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid gap-6 border-border border-b pb-8 lg:grid-cols-[1fr_0.65fr] lg:items-end">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
                Requests for solutions
              </p>
              <h1 className="mt-4 font-mono text-[clamp(3rem,8vw,7rem)] font-black uppercase leading-[0.85] tracking-[-0.07em]">
                Tell builders what matters.
              </h1>
            </div>
            <p className="font-mono text-sm uppercase leading-7 tracking-[0.16em] text-muted-foreground">
              If you are in Venezuela, leave concrete problems that technology,
              coordination, logistics, or information tools could help solve.
              The community votes and comments in real time.
            </p>
          </div>

          <RequestsBoard
            initialRequests={requests}
            initialSignedIn={Boolean(userId)}
          />
        </div>
      </section>
    </ProjectShell>
  );
}
