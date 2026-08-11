"use client";

import {
  ClockCounterClockwiseIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { BuilderProfile } from "@/lib/builders/schema";
import type { Project } from "@/lib/projects/schema";
import type { SolutionRequest } from "@/lib/requests/schema";

const RECENT_SEARCHES_KEY = "b4v-recent-searches-v1";

type SearchData = {
  projects: Project[];
  builders: BuilderProfile[];
  requests: SolutionRequest[];
};

type SearchLabels = {
  label: string;
  description: string;
  placeholder: string;
  loading: string;
  empty: string;
  error: string;
  recent: string;
  projects: string;
  builders: string;
  needs: string;
};

type CommandSearchProps = {
  locale: string;
  labels: SearchLabels;
};

export function CommandSearch({ locale, labels }: CommandSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(
    query.trim().toLocaleLowerCase(locale),
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function loadData() {
    if (data || loading) return;

    setLoading(true);
    setFailed(false);

    try {
      const [projectsResponse, buildersResponse, requestsResponse] =
        await Promise.all([
          fetch("/api/projects"),
          fetch("/api/builders"),
          fetch("/api/requests"),
        ]);

      if (
        !projectsResponse.ok ||
        !buildersResponse.ok ||
        !requestsResponse.ok
      ) {
        throw new Error("Search data request failed");
      }

      const [projectsBody, buildersBody, requestsBody] = await Promise.all([
        projectsResponse.json() as Promise<{ projects: Project[] }>,
        buildersResponse.json() as Promise<{ builders: BuilderProfile[] }>,
        requestsResponse.json() as Promise<{ requests: SolutionRequest[] }>,
      ]);

      startTransition(() => {
        setData({
          projects: projectsBody.projects,
          builders: buildersBody.builders,
          requests: requestsBody.requests,
        });
      });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) return;

    try {
      const stored = JSON.parse(
        window.localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]",
      );
      setRecent(Array.isArray(stored) ? stored.slice(0, 4) : []);
    } catch {
      setRecent([]);
    }

    void loadData();
  }

  function rememberSearch() {
    const value = query.trim();
    if (!value) return;

    const next = [value, ...recent.filter((item) => item !== value)].slice(
      0,
      4,
    );
    setRecent(next);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  }

  const results = data
    ? {
        projects: data.projects
          .filter((project) =>
            `${project.name} ${project.descriptionMarkdown} ${project.countries.join(" ")}`
              .toLocaleLowerCase(locale)
              .includes(deferredQuery),
          )
          .slice(0, 5),
        builders: data.builders
          .filter((builder) =>
            `${builder.name} ${builder.customRole} ${builder.description}`
              .toLocaleLowerCase(locale)
              .includes(deferredQuery),
          )
          .slice(0, 4),
        requests: data.requests
          .filter((request) =>
            `${request.name} ${request.descriptionMarkdown}`
              .toLocaleLowerCase(locale)
              .includes(deferredQuery),
          )
          .slice(0, 4),
      }
    : null;
  const resultCount = results
    ? results.projects.length +
      results.builders.length +
      results.requests.length
    : 0;

  return (
    <>
      <Button
        aria-label={labels.label}
        onClick={() => handleOpenChange(true)}
        size="icon"
        title={`${labels.label} (⌘K)`}
        type="button"
        variant="ghost"
      >
        <MagnifyingGlassIcon />
      </Button>
      <CommandDialog
        className="top-[12vh] max-w-xl translate-y-0 text-sm shadow-2xl duration-0 sm:max-w-xl"
        description={labels.description}
        onOpenChange={handleOpenChange}
        open={open}
        title={labels.label}
      >
        <Command shouldFilter={false}>
          <CommandInput
            autoFocus
            onValueChange={setQuery}
            placeholder={labels.placeholder}
            value={query}
          />
          <CommandList>
            {!query.trim() && recent.length > 0 ? (
              <SearchGroup label={labels.recent}>
                {recent.map((item) => (
                  <CommandItem
                    key={item}
                    onSelect={() => setQuery(item)}
                    value={`recent-${item}`}
                  >
                    <ClockCounterClockwiseIcon />
                    {item}
                  </CommandItem>
                ))}
              </SearchGroup>
            ) : null}

            {loading ? <SearchMessage>{labels.loading}</SearchMessage> : null}
            {failed ? <SearchMessage>{labels.error}</SearchMessage> : null}
            {results && resultCount === 0 ? (
              <CommandEmpty>{labels.empty}</CommandEmpty>
            ) : null}

            {results && resultCount > 0 ? (
              <>
                <SearchGroup label={labels.projects}>
                  {results.projects.map((project) => (
                    <SearchResult
                      description={project.countries.join(" / ")}
                      href={`/${locale}/p/${project.slug}`}
                      key={project.id}
                      onSelect={() => {
                        rememberSearch();
                        setOpen(false);
                        router.push(`/${locale}/p/${project.slug}`);
                      }}
                      title={project.name}
                    />
                  ))}
                </SearchGroup>
                <SearchGroup label={labels.builders}>
                  {results.builders.map((builder) => (
                    <SearchResult
                      description={
                        builder.customRole || builder.role.replaceAll("_", " ")
                      }
                      href={`/${locale}/builders`}
                      key={builder.id}
                      onSelect={() => {
                        rememberSearch();
                        setOpen(false);
                        router.push(`/${locale}/builders`);
                      }}
                      title={builder.name}
                    />
                  ))}
                </SearchGroup>
                <SearchGroup label={labels.needs}>
                  {results.requests.map((request) => (
                    <SearchResult
                      description={request.authorName}
                      href={`/${locale}/requests`}
                      key={request.id}
                      onSelect={() => {
                        rememberSearch();
                        setOpen(false);
                        router.push(`/${locale}/requests`);
                      }}
                      title={request.name}
                    />
                  ))}
                </SearchGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

function SearchGroup({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  if (!children || (Array.isArray(children) && children.length === 0))
    return null;

  return <CommandGroup heading={label}>{children}</CommandGroup>;
}

function SearchResult({
  description,
  href,
  onSelect,
  title,
}: {
  description: string;
  href: string;
  onSelect: () => void;
  title: string;
}) {
  return (
    <CommandItem
      className="min-w-0 justify-between"
      onSelect={onSelect}
      value={`${title} ${description} ${href}`}
    >
      <span className="truncate font-medium">{title}</span>
      <span className="max-w-40 truncate text-xs text-muted-foreground">
        {description}
      </span>
    </CommandItem>
  );
}

function SearchMessage({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
