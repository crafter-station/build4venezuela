"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteProject,
  ProjectFormError,
  projectQueryKeys,
  saveProject,
} from "@/lib/projects/queries";
import {
  type ProjectFormState,
  projectLifecycleStatuses,
} from "@/lib/projects/schema";

type ProjectFormProps = {
  initialState: ProjectFormState;
  projectId?: string;
  submitLabel: string;
};

const projectFormFields = [
  "slug",
  "name",
  "lifecycleStatus",
  "projectUrl",
  "countries",
  "participantName",
  "videoUrl",
  "contributeInUrl",
  "descriptionMarkdown",
] as const;

type ProjectFormField = (typeof projectFormFields)[number];
type ProjectFormValues = Record<ProjectFormField, string>;

function projectFormValuesFromState(
  values: ProjectFormState["values"],
): ProjectFormValues {
  return Object.fromEntries(
    projectFormFields.map((field) => [
      field,
      values[field] ?? (field === "lifecycleStatus" ? "ready_to_use" : ""),
    ]),
  ) as ProjectFormValues;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-destructive text-xs uppercase tracking-[0.16em]">
      {message}
    </p>
  );
}

export function ProjectForm({
  initialState,
  projectId,
  submitLabel,
}: ProjectFormProps) {
  const locale = useLocale();
  const t = useTranslations("ProjectForm");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(() =>
    projectFormValuesFromState(initialState.values),
  );
  const [errors, setErrors] = useState(initialState.errors);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const projectMutation = useMutation({
    mutationFn: saveProject,
    onError: (error: Error) => {
      if (error instanceof ProjectFormError) {
        setValues(projectFormValuesFromState(error.values));
        setErrors(error.errors);
        return;
      }

      setErrors({ form: error.message });
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.list() });
      router.push(`/${locale}/p/${project.slug}`);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onError: (error: Error) => {
      setErrors({ form: error.message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.list() });
      router.push(`/${locale}/projects`);
      router.refresh();
    },
  });

  function handleValueChange(field: ProjectFormField) {
    return (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setValues((currentValues) => ({
        ...currentValues,
        [field]: event.target.value,
      }));
      setErrors((currentErrors) => {
        const {
          [field]: _fieldError,
          form: _formError,
          ...nextErrors
        } = currentErrors;
        return nextErrors;
      });
    };
  }

  function setFieldValue(field: ProjectFormField, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setErrors((currentErrors) => {
      const {
        [field]: _fieldError,
        form: _formError,
        ...nextErrors
      } = currentErrors;
      return nextErrors;
    });
  }

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    projectMutation.mutate({ projectId, values });
  }

  function requestDelete() {
    setErrors({});

    if (!projectId) {
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    deleteMutation.mutate(projectId);
  }

  return (
    <form className="grid gap-6" onSubmit={submitProject}>
      {errors.form ? (
        <div className="border border-destructive bg-destructive/10 p-4 font-mono text-sm uppercase tracking-[0.12em] text-destructive">
          {errors.form}
        </div>
      ) : null}

      <label className="grid gap-2" htmlFor="project-slug">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("slugLabel")}
        </span>
        <Input
          id="project-slug"
          name="slug"
          onChange={handleValueChange("slug")}
          placeholder={t("slugPlaceholder")}
          required
          value={values.slug}
        />
        <FieldError message={errors.slug} />
      </label>

      <label className="grid gap-2" htmlFor="project-name">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("nameLabel")}
        </span>
        <Input
          id="project-name"
          name="name"
          onChange={handleValueChange("name")}
          required
          value={values.name}
        />
        <FieldError message={errors.name} />
      </label>

      <label className="grid gap-2" htmlFor="project-lifecycle-status">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("lifecycleStatusLabel")}
        </span>
        <select
          className="flex h-10 w-full border border-input bg-background px-3 py-2 font-mono text-sm uppercase tracking-[0.12em] text-foreground ring-offset-background transition file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          id="project-lifecycle-status"
          name="lifecycleStatus"
          onChange={handleValueChange("lifecycleStatus")}
          required
          value={values.lifecycleStatus}
        >
          {projectLifecycleStatuses.map((status) => (
            <option key={status} value={status}>
              {t(`lifecycleStatuses.${status}`)}
            </option>
          ))}
        </select>
        <FieldError message={errors.lifecycleStatus} />
      </label>

      <label className="grid gap-2" htmlFor="project-url">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("projectUrlLabel")}
        </span>
        <Input
          id="project-url"
          name="projectUrl"
          onChange={handleValueChange("projectUrl")}
          placeholder="https://..."
          required
          type="url"
          value={values.projectUrl}
        />
        <FieldError message={errors.projectUrl} />
      </label>

      <label className="grid gap-2" htmlFor="project-countries">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("countriesLabel")}
        </span>
        <Input
          id="project-countries"
          name="countries"
          onChange={handleValueChange("countries")}
          placeholder={t("countriesPlaceholder")}
          required
          value={values.countries}
        />
        <FieldError message={errors.countries} />
      </label>

      <label className="grid gap-2" htmlFor="project-participant-name">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("participantNameLabel")}
        </span>
        <Input
          id="project-participant-name"
          name="participantName"
          onChange={handleValueChange("participantName")}
          required
          value={values.participantName}
        />
        <FieldError message={errors.participantName} />
      </label>

      <label className="grid gap-2" htmlFor="project-video-url">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("videoUrlLabel")}
        </span>
        <Input
          id="project-video-url"
          name="videoUrl"
          onChange={handleValueChange("videoUrl")}
          placeholder={t("videoUrlPlaceholder")}
          type="url"
          value={values.videoUrl}
        />
        <FieldError message={errors.videoUrl} />
      </label>

      <label className="grid gap-2" htmlFor="project-contribute-in-url">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("contributeInUrlLabel")}
        </span>
        <Input
          id="project-contribute-in-url"
          name="contributeInUrl"
          onChange={handleValueChange("contributeInUrl")}
          placeholder={t("contributeInUrlPlaceholder")}
          type="url"
          value={values.contributeInUrl}
        />
        <FieldError message={errors.contributeInUrl} />
      </label>

      <div className="grid gap-2">
        <label
          className="font-mono text-muted-foreground text-xs font-bold uppercase tracking-[0.18em]"
          htmlFor="project-description"
        >
          {t("descriptionMarkdownLabel")}
        </label>
        <MarkdownEditor
          id="project-description"
          name="descriptionMarkdown"
          onChange={(value) => setFieldValue("descriptionMarkdown", value)}
          placeholder={t("descriptionMarkdownPlaceholder")}
          required
          value={values.descriptionMarkdown}
        />
        {/* ponytail: red below min (80), muted when valid — mirrors Zod min/max(80, 12000) */}
        <p
          className={`font-mono text-xs uppercase tracking-[0.16em] ${values.descriptionMarkdown.length < 80 ? "text-destructive" : "text-muted-foreground"}`}
        >
          {values.descriptionMarkdown.length} / 12000
        </p>
        <FieldError message={errors.descriptionMarkdown} />
      </div>

      <Button
        className="h-12 text-sm uppercase tracking-[0.18em]"
        disabled={projectMutation.isPending || deleteMutation.isPending}
        type="submit"
      >
        {projectMutation.isPending ? t("pending") : submitLabel}
      </Button>

      {projectId ? (
        <div className="border border-destructive/40 bg-destructive/10 p-4">
          <p className="font-mono text-destructive text-xs uppercase tracking-[0.16em]">
            {confirmDelete ? t("deleteConfirm") : t("deleteDescription")}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              className="h-10 uppercase tracking-[0.18em]"
              disabled={projectMutation.isPending || deleteMutation.isPending}
              onClick={requestDelete}
              type="button"
              variant="destructive"
            >
              {deleteMutation.isPending
                ? t("deletePending")
                : confirmDelete
                  ? t("deleteConfirmButton")
                  : t("deleteButton")}
            </Button>
            {confirmDelete ? (
              <Button
                className="h-10 uppercase tracking-[0.18em]"
                disabled={deleteMutation.isPending}
                onClick={() => setConfirmDelete(false)}
                type="button"
                variant="outline"
              >
                {t("deleteCancel")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}
