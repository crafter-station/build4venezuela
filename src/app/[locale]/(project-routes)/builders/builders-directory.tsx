"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import {
  ArrowSquareOutIcon,
  CaretLeftIcon,
  CaretRightIcon,
  EnvelopeSimpleIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  builderQueryKeys,
  createBuilderContactRequest,
  fetchBuilders,
  fetchOwnedProjects,
} from "@/lib/builders/queries";
import {
  availabilityDays,
  type BuilderContactRequestInput,
  type BuilderProfile,
  type BuilderRole,
  builderRoles,
} from "@/lib/builders/schema";

type BuildersDirectoryProps = {
  initialBuilders: BuilderProfile[];
  initialSignedIn: boolean;
};

type ContactDraft = BuilderContactRequestInput;

const emptyDraft: ContactDraft = {
  projectName: "",
  coverLetter: "",
  contactEmail: "",
  contactPhone: "",
  projectSlug: "",
};

const BUILDERS_PER_PAGE = 10;

function availabilityText(
  builder: BuilderProfile,
  t: ReturnType<typeof useTranslations<"Builders.directory">>,
) {
  if (!builder.availabilityVisible) {
    return t("availabilityHidden");
  }

  return t("hoursPerWeek", { hours: builder.weeklyHours });
}

function roleText(
  builder: BuilderProfile,
  t: ReturnType<typeof useTranslations<"Builders.directory">>,
) {
  if (builder.role === "other" && builder.customRole) {
    return builder.customRole;
  }

  return t(`roles.${builder.role}`);
}

function CharCount({
  value,
  min,
  max,
}: {
  value: string;
  min?: number;
  max: number;
}) {
  const belowMin = min !== undefined && value.length < min;

  return (
    <p
      className={`font-mono text-xs uppercase tracking-[0.12em] ${belowMin ? "text-destructive" : "text-muted-foreground"}`}
    >
      {value.length} / {max}
    </p>
  );
}

function hasMinimumHours(builder: BuilderProfile, minimumHours: string) {
  const minimum = Number(minimumHours);

  if (!minimum) {
    return true;
  }

  return builder.availabilityVisible && builder.weeklyHours >= minimum;
}

export function BuildersDirectory({
  initialBuilders,
  initialSignedIn,
}: BuildersDirectoryProps) {
  const t = useTranslations("Builders.directory");
  const { isSignedIn, user } = useUser();
  const signedIn = isSignedIn ?? initialSignedIn;
  const viewerId = signedIn ? user?.id : null;
  const queryClient = useQueryClient();
  const { data: builders = initialBuilders, isFetching } = useQuery({
    initialData: initialBuilders,
    queryFn: fetchBuilders,
    queryKey: builderQueryKeys.list(viewerId),
  });
  const { data: ownedProjects = [] } = useQuery({
    enabled: signedIn,
    queryFn: fetchOwnedProjects,
    queryKey: builderQueryKeys.ownedProjects(),
  });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<BuilderRole | "all">("all");
  const [minimumHours, setMinimumHours] = useState("0");
  const [page, setPage] = useState(1);
  const [activeBuilderId, setActiveBuilderId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ContactDraft>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredBuilders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return builders.filter((builder) => {
      const textMatch = [
        builder.name,
        roleText(builder, t),
        builder.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
      const roleMatch = role === "all" || builder.role === role;

      return textMatch && roleMatch && hasMinimumHours(builder, minimumHours);
    });
  }, [builders, minimumHours, role, search, t]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBuilders.length / BUILDERS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const paginatedBuilders = filteredBuilders.slice(
    (currentPage - 1) * BUILDERS_PER_PAGE,
    currentPage * BUILDERS_PER_PAGE,
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const contactMutation = useMutation({
    mutationFn: ({
      builderId,
      values,
    }: {
      builderId: string;
      values: ContactDraft;
    }) => createBuilderContactRequest(builderId, values),
    onError: (error: Error, variables) => {
      const apiError = error as Error & { code?: string };
      const message =
        apiError.code === "builderContactSpam"
          ? t("requestSpamError")
          : error.message;

      setStatus((current) => {
        const { [variables.builderId]: _cleared, ...next } = current;
        return next;
      });
      setErrors((current) => ({
        ...current,
        [variables.builderId]: message,
      }));
    },
    onSuccess: (_request, variables) => {
      queryClient.invalidateQueries({
        queryKey: builderQueryKeys.contactRequests(),
      });
      setDrafts((current) => ({
        ...current,
        [variables.builderId]: emptyDraft,
      }));
      setErrors((current) => {
        const { [variables.builderId]: _cleared, ...next } = current;
        return next;
      });
      setStatus((current) => ({
        ...current,
        [variables.builderId]: t("requestSent"),
      }));
      setActiveBuilderId(null);
    },
  });

  function draftFor(builderId: string) {
    return drafts[builderId] ?? emptyDraft;
  }

  function setDraftField(
    builderId: string,
    field: keyof ContactDraft,
    value: string,
  ) {
    setDrafts((current) => ({
      ...current,
      [builderId]: { ...draftFor(builderId), [field]: value },
    }));
    setStatus((current) => {
      const { [builderId]: _builderStatus, ...next } = current;
      return next;
    });
    setErrors((current) => {
      const { [builderId]: _builderError, ...next } = current;
      return next;
    });
  }

  function setAttachedProject(builderId: string, slug: string) {
    const project = ownedProjects.find((item) => item.slug === slug);

    setDrafts((current) => {
      const base = current[builderId] ?? emptyDraft;
      return {
        ...current,
        [builderId]: {
          ...base,
          projectSlug: slug,
          // Attaching a project uses its registered name; clearing the
          // attachment leaves whatever the user had typed.
          projectName: project ? project.name : base.projectName,
        },
      };
    });
  }

  function submitContact(builderId: string) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      contactMutation.mutate({ builderId, values: draftFor(builderId) });
    };
  }

  function resetDirectoryPage() {
    setPage(1);
    setActiveBuilderId(null);
  }

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
    setActiveBuilderId(null);
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-3 border border-border bg-card p-4 lg:grid-cols-[1fr_16rem_12rem]">
        <Input
          aria-label={t("searchLabel")}
          onChange={(event) => {
            setSearch(event.target.value);
            resetDirectoryPage();
          }}
          placeholder={t("searchPlaceholder")}
          value={search}
        />
        <select
          aria-label={t("roleFilterLabel")}
          className="h-8 border border-input bg-background px-2.5 font-mono text-xs uppercase tracking-[0.1em]"
          onChange={(event) => {
            setRole(event.target.value as BuilderRole | "all");
            resetDirectoryPage();
          }}
          value={role}
        >
          <option value="all">{t("allRoles")}</option>
          {builderRoles.map((builderRole) => (
            <option key={builderRole} value={builderRole}>
              {t(`roles.${builderRole}`)}
            </option>
          ))}
        </select>
        <select
          aria-label={t("hoursFilterLabel")}
          className="h-8 border border-input bg-background px-2.5 font-mono text-xs uppercase tracking-[0.1em]"
          onChange={(event) => {
            setMinimumHours(event.target.value);
            resetDirectoryPage();
          }}
          value={minimumHours}
        >
          <option value="0">{t("anyHours")}</option>
          <option value="5">{t("minimumHours", { hours: 5 })}</option>
          <option value="10">{t("minimumHours", { hours: 10 })}</option>
          <option value="20">{t("minimumHours", { hours: 20 })}</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        <span>{t("builderCount", { count: filteredBuilders.length })}</span>
        <span>{isFetching ? t("refreshing") : t("liveDirectory")}</span>
      </div>

      {filteredBuilders.length === 0 ? (
        <div className="border border-border p-8 font-mono text-sm uppercase leading-7 tracking-[0.1em] text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="grid gap-5">
          {paginatedBuilders.map((builder) => {
            const draft = draftFor(builder.id);
            const isActive = activeBuilderId === builder.id;

            return (
              <article
                className="grid gap-5 border border-border bg-card p-5"
                key={builder.id}
              >
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-2xl font-black uppercase">
                        {builder.name}
                      </h2>
                      <span className="border border-border px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                        {roleText(builder, t)}
                      </span>
                      <span className="border border-border px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                        {availabilityText(builder, t)}
                      </span>
                    </div>
                    <p className="mt-4 max-w-3xl whitespace-pre-wrap font-mono text-sm uppercase leading-7 tracking-[0.08em] text-muted-foreground">
                      {builder.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {builder.linkedinUrl ? (
                      <a
                        className="inline-flex h-8 items-center justify-center gap-1.5 border border-border bg-background px-2.5 font-mono text-xs font-medium transition hover:bg-muted"
                        href={builder.linkedinUrl}
                      >
                        LinkedIn
                        <ArrowSquareOutIcon data-icon="inline-end" />
                      </a>
                    ) : null}
                    {builder.portfolioUrl ? (
                      <a
                        className="inline-flex h-8 items-center justify-center gap-1.5 border border-border bg-background px-2.5 font-mono text-xs font-medium transition hover:bg-muted"
                        href={builder.portfolioUrl}
                      >
                        {t("portfolio")}
                        <ArrowSquareOutIcon data-icon="inline-end" />
                      </a>
                    ) : null}
                    {signedIn ? (
                      <Button
                        onClick={() =>
                          setActiveBuilderId(isActive ? null : builder.id)
                        }
                        type="button"
                      >
                        <EnvelopeSimpleIcon data-icon="inline-start" />
                        {t("contact")}
                      </Button>
                    ) : (
                      <SignInButton mode="modal">
                        <Button type="button">
                          <EnvelopeSimpleIcon data-icon="inline-start" />
                          {t("signIn")}
                        </Button>
                      </SignInButton>
                    )}
                  </div>
                </div>

                {builder.availabilityVisible ? (
                  <div className="grid grid-cols-4 gap-1.5 border-border border-t pt-4 sm:grid-cols-7 sm:gap-2">
                    {availabilityDays.map((day) => {
                      const hours = builder.availability[day];
                      const unavailable = !hours;

                      return (
                        <div
                          className={`border border-border p-1.5 text-center sm:p-2 ${
                            unavailable ? "opacity-50" : ""
                          }`}
                          key={day}
                        >
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
                            {t(`days.${day}`)}
                          </p>
                          {unavailable ? (
                            <p className="mt-1 font-mono text-[9px] uppercase leading-tight tracking-[0.08em] text-muted-foreground">
                              {t("unavailable")}
                            </p>
                          ) : (
                            <p className="mt-1 font-mono text-base font-black sm:text-lg">
                              {hours}h
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {errors[builder.id] ? (
                  <div className="border border-destructive bg-destructive/10 p-3 font-mono text-xs uppercase leading-5 tracking-[0.1em] text-destructive">
                    {errors[builder.id]}
                  </div>
                ) : null}

                {status[builder.id] ? (
                  <div className="border border-border bg-background p-3 font-mono text-xs uppercase leading-5 tracking-[0.1em] text-muted-foreground">
                    {status[builder.id]}
                  </div>
                ) : null}

                {isActive ? (
                  <form
                    className="grid gap-4 border-border border-t pt-5"
                    onSubmit={submitContact(builder.id)}
                  >
                    {ownedProjects.length > 0 ? (
                      <div className="grid gap-2 border border-border bg-background p-3">
                        <label className="flex items-start gap-2 font-mono text-xs uppercase leading-5 tracking-[0.1em] text-muted-foreground">
                          <input
                            checked={Boolean(draft.projectSlug)}
                            className="mt-0.5 h-4 w-4 accent-foreground"
                            onChange={(event) =>
                              setAttachedProject(
                                builder.id,
                                event.target.checked
                                  ? ownedProjects[0].slug
                                  : "",
                              )
                            }
                            type="checkbox"
                          />
                          <span>{t("attachProject")}</span>
                        </label>
                        {draft.projectSlug ? (
                          ownedProjects.length > 1 ? (
                            <select
                              aria-label={t("attachProject")}
                              className="h-8 border border-input bg-background px-2.5 font-mono text-xs uppercase tracking-[0.1em]"
                              onChange={(event) =>
                                setAttachedProject(
                                  builder.id,
                                  event.target.value,
                                )
                              }
                              value={draft.projectSlug}
                            >
                              {ownedProjects.map((project) => (
                                <option key={project.slug} value={project.slug}>
                                  {project.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="font-mono text-xs uppercase tracking-[0.1em] text-foreground">
                              {t("attachProjectNamed", {
                                name: ownedProjects[0].name,
                              })}
                            </p>
                          )
                        ) : null}
                      </div>
                    ) : null}
                    <label
                      className="grid gap-2"
                      htmlFor={`project-${builder.id}`}
                    >
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        {t("projectName")}
                      </span>
                      <Input
                        id={`project-${builder.id}`}
                        maxLength={160}
                        minLength={2}
                        onChange={(event) =>
                          setDraftField(
                            builder.id,
                            "projectName",
                            event.target.value,
                          )
                        }
                        readOnly={Boolean(draft.projectSlug)}
                        required
                        value={draft.projectName}
                      />
                      <CharCount max={160} min={2} value={draft.projectName} />
                    </label>
                    <label
                      className="grid gap-2"
                      htmlFor={`letter-${builder.id}`}
                    >
                      <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        {t("coverLetter")}
                      </span>
                      <span className="font-mono text-[11px] normal-case leading-4 tracking-[0.04em] text-muted-foreground">
                        {t("coverLetterHint")}
                      </span>
                      <Textarea
                        id={`letter-${builder.id}`}
                        maxLength={2000}
                        minLength={40}
                        onChange={(event) =>
                          setDraftField(
                            builder.id,
                            "coverLetter",
                            event.target.value,
                          )
                        }
                        placeholder={t("coverLetterPlaceholder")}
                        required
                        rows={5}
                        value={draft.coverLetter}
                      />
                      <CharCount
                        max={2000}
                        min={40}
                        value={draft.coverLetter}
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label
                        className="grid gap-2"
                        htmlFor={`email-${builder.id}`}
                      >
                        <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          {t("contactEmail")}
                        </span>
                        <Input
                          id={`email-${builder.id}`}
                          onChange={(event) =>
                            setDraftField(
                              builder.id,
                              "contactEmail",
                              event.target.value,
                            )
                          }
                          type="email"
                          value={draft.contactEmail}
                        />
                      </label>
                      <label
                        className="grid gap-2"
                        htmlFor={`phone-${builder.id}`}
                      >
                        <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          {t("contactPhone")}
                        </span>
                        <Input
                          id={`phone-${builder.id}`}
                          maxLength={80}
                          onChange={(event) =>
                            setDraftField(
                              builder.id,
                              "contactPhone",
                              event.target.value,
                            )
                          }
                          value={draft.contactPhone}
                        />
                      </label>
                    </div>
                    <Button
                      className="h-10 justify-self-start uppercase tracking-[0.14em]"
                      disabled={contactMutation.isPending}
                      type="submit"
                    >
                      {contactMutation.isPending
                        ? t("checking")
                        : t("sendRequest")}
                    </Button>
                  </form>
                ) : null}
              </article>
            );
          })}
          {totalPages > 1 ? (
            <nav
              aria-label={t("paginationLabel")}
              className="flex flex-wrap items-center justify-between gap-3 border-border border-t pt-3"
            >
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {t("pageStatus", { page: currentPage, total: totalPages })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  className="h-9 uppercase tracking-[0.12em]"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  type="button"
                  variant="outline"
                >
                  <CaretLeftIcon data-icon="inline-start" />
                  {t("previousPage")}
                </Button>
                <Button
                  className="h-9 uppercase tracking-[0.12em]"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  type="button"
                  variant="outline"
                >
                  {t("nextPage")}
                  <CaretRightIcon data-icon="inline-end" />
                </Button>
              </div>
            </nav>
          ) : null}
        </div>
      )}
    </div>
  );
}
