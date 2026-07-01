"use client";

import {
  PauseCircleIcon,
  TrashIcon,
  UserCircleCheckIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  builderQueryKeys,
  removeBuilderProfile,
  saveBuilderProfile,
  setBuilderProfileFrozen,
} from "@/lib/builders/queries";
import {
  availabilityDays,
  type BuilderProfile,
  type BuilderProfileInput,
  builderRoles,
  emptyAvailability,
} from "@/lib/builders/schema";

type BuilderFormProps = {
  initialBuilder: BuilderProfile | null;
  locale: string;
};

type BuilderFormValues = Omit<BuilderProfileInput, "availabilityVisible"> & {
  availabilityVisible: boolean;
};

function initialValues(builder: BuilderProfile | null): BuilderFormValues {
  return {
    name: builder?.name ?? "",
    role: builder?.role ?? "fullstack_engineer",
    customRole: builder?.customRole ?? "",
    description: builder?.description ?? "",
    linkedinUrl: builder?.linkedinUrl ?? "",
    portfolioUrl: builder?.portfolioUrl ?? "",
    availabilityVisible: builder?.availabilityVisible ?? false,
    availability: builder?.availability ?? emptyAvailability(),
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="mt-2 text-destructive text-xs uppercase tracking-[0.12em]">
      {message}
    </p>
  );
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

export function BuilderForm({ initialBuilder, locale }: BuilderFormProps) {
  const t = useTranslations("Builders.registerPage.form");
  const directoryT = useTranslations("Builders.directory");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentBuilder, setCurrentBuilder] = useState(initialBuilder);
  const [values, setValues] = useState(() => initialValues(initialBuilder));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isFrozen = currentBuilder?.status !== "available";

  const totalHours = useMemo(
    () =>
      availabilityDays.reduce(
        (total, day) => total + Number(values.availability[day] ?? 0),
        0,
      ),
    [values.availability],
  );

  const mutation = useMutation({
    mutationFn: saveBuilderProfile,
    onError: (error: Error) => {
      setNotice(null);
      setErrors({ form: error.message });
    },
    onSuccess: (builder) => {
      setCurrentBuilder(builder);
      queryClient.invalidateQueries({ queryKey: builderQueryKeys.list() });
      setNotice(t("savedNotice"));

      if (!initialBuilder) {
        router.push(`/${locale}/builders`);
      }
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: setBuilderProfileFrozen,
    onError: (error: Error) => {
      setNotice(null);
      setErrors({ form: error.message });
    },
    onSuccess: (builder) => {
      setCurrentBuilder(builder);
      setErrors({});
      setNotice(
        builder.status === "available" ? t("visibleNotice") : t("frozenNotice"),
      );
      queryClient.invalidateQueries({ queryKey: builderQueryKeys.list() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeBuilderProfile,
    onError: (error: Error) => {
      setNotice(null);
      setErrors({ form: error.message });
    },
    onSuccess: () => {
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: builderQueryKeys.list() });
      queryClient.invalidateQueries({
        queryKey: builderQueryKeys.contactRequests(),
      });
      router.push(`/${locale}/builders`);
    },
  });

  function setField<K extends keyof BuilderFormValues>(
    field: K,
    value: BuilderFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const { [field]: _fieldError, form: _formError, ...next } = current;
      return next;
    });
  }

  function textChange(field: keyof BuilderFormValues) {
    return (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setField(field, event.target.value as never);
    };
  }

  function changeRole(event: ChangeEvent<HTMLSelectElement>) {
    setValues((current) => ({
      ...current,
      role: event.target.value as BuilderFormValues["role"],
      customRole: event.target.value === "other" ? current.customRole : "",
    }));
    setErrors((current) => {
      const {
        role: _roleError,
        customRole: _customRoleError,
        form: _formError,
        ...next
      } = current;
      return next;
    });
  }

  function setPreset(kind: "weekdays" | "weekends" | "clear", hours = 2) {
    setValues((current) => {
      const availability = emptyAvailability();

      if (kind === "weekdays") {
        for (const day of availabilityDays.slice(0, 5)) {
          availability[day] = hours;
        }
      }

      if (kind === "weekends") {
        for (const day of availabilityDays.slice(5)) {
          availability[day] = hours;
        }
      }

      return { ...current, availability };
    });
  }

  function setDayHours(day: (typeof availabilityDays)[number], hours: string) {
    const nextHours = Math.min(12, Math.max(0, Number(hours) || 0));
    setValues((current) => ({
      ...current,
      availability: { ...current.availability, [day]: nextHours },
    }));
    return nextHours;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setNotice(null);
    mutation.mutate(values);
  }

  return (
    <form className="grid gap-6" onSubmit={submit}>
      {errors.form ? (
        <div className="border border-destructive bg-destructive/10 p-4 font-mono text-sm uppercase tracking-[0.12em] text-destructive">
          {errors.form}
        </div>
      ) : null}

      {notice ? (
        <div className="border border-primary bg-primary/10 p-4 font-mono text-sm uppercase tracking-[0.12em] text-primary">
          {notice}
        </div>
      ) : null}

      {currentBuilder ? (
        <section className="grid gap-4 border border-border p-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {t("profileStatusTitle")}
              </p>
              <p className="mt-2 font-mono text-sm uppercase leading-6 tracking-[0.08em]">
                {isFrozen ? t("frozenDescription") : t("visibleDescription")}
              </p>
            </div>
            <span
              className={`border px-2 py-1 font-mono text-xs font-black uppercase tracking-[0.12em] ${
                isFrozen
                  ? "border-muted-foreground text-muted-foreground"
                  : "border-primary text-primary"
              }`}
            >
              {isFrozen ? t("frozenStatus") : t("visibleStatus")}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={visibilityMutation.isPending}
              onClick={() => visibilityMutation.mutate(!isFrozen)}
              type="button"
              variant="outline"
            >
              {isFrozen ? (
                <UserCircleCheckIcon data-icon="inline-start" />
              ) : (
                <PauseCircleIcon data-icon="inline-start" />
              )}
              {isFrozen ? t("showProfile") : t("hideProfile")}
            </Button>
            <Button
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteOpen(true)}
              type="button"
              variant="destructive"
            >
              <TrashIcon data-icon="inline-start" />
              {t("deleteProfile")}
            </Button>
          </div>

          <Dialog
            open={deleteOpen}
            onOpenChange={(open) => setDeleteOpen(open)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
                <DialogDescription>
                  {t("deleteDialogDescription")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  disabled={deleteMutation.isPending}
                  onClick={() => setDeleteOpen(false)}
                  type="button"
                  variant="outline"
                >
                  {t("cancel")}
                </Button>
                <Button
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                  type="button"
                  variant="destructive"
                >
                  {deleteMutation.isPending
                    ? t("deleting")
                    : t("deleteProfile")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      ) : null}

      <label className="grid gap-2" htmlFor="builder-name">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {t("name")}
        </span>
        <Input
          id="builder-name"
          maxLength={120}
          minLength={2}
          onChange={textChange("name")}
          required
          value={values.name}
        />
        <CharCount max={120} min={2} value={values.name} />
        <FieldError message={errors.name} />
      </label>

      <label className="grid gap-2" htmlFor="builder-role">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {t("role")}
        </span>
        <select
          className="flex h-10 w-full border border-input bg-background px-3 py-2 font-mono text-sm uppercase tracking-widest text-foreground ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          id="builder-role"
          onChange={changeRole}
          required
          value={values.role}
        >
          {builderRoles.map((role) => (
            <option key={role} value={role}>
              {directoryT(`roles.${role}`)}
            </option>
          ))}
        </select>
        <FieldError message={errors.role} />
      </label>

      {values.role === "other" ? (
        <label className="grid gap-2" htmlFor="builder-custom-role">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {t("customRole")}
          </span>
          <Input
            id="builder-custom-role"
            maxLength={80}
            minLength={2}
            onChange={textChange("customRole")}
            placeholder={t("customRolePlaceholder")}
            required
            value={values.customRole}
          />
          <CharCount max={80} min={2} value={values.customRole} />
          <FieldError message={errors.customRole} />
        </label>
      ) : null}

      <label className="grid gap-2" htmlFor="builder-description">
        <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {t("description")}
        </span>
        <Textarea
          id="builder-description"
          maxLength={2000}
          minLength={40}
          onChange={textChange("description")}
          placeholder={t("descriptionPlaceholder")}
          required
          rows={7}
          value={values.description}
        />
        <CharCount max={2000} min={40} value={values.description} />
        <FieldError message={errors.description} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2" htmlFor="builder-linkedin">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {t("linkedin")}
          </span>
          <Input
            id="builder-linkedin"
            onChange={textChange("linkedinUrl")}
            placeholder="https://..."
            type="url"
            value={values.linkedinUrl}
          />
        </label>
        <label className="grid gap-2" htmlFor="builder-portfolio">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {t("portfolio")}
          </span>
          <Input
            id="builder-portfolio"
            onChange={textChange("portfolioUrl")}
            placeholder="https://..."
            type="url"
            value={values.portfolioUrl}
          />
        </label>
      </div>

      <section className="grid gap-4 border border-border p-4">
        <label className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.12em]">
          <input
            checked={values.availabilityVisible}
            className="size-4 accent-primary"
            onChange={(event) =>
              setField("availabilityVisible", event.target.checked)
            }
            type="checkbox"
          />
          {t("setAvailability")}
        </label>
        <p className="font-mono text-xs uppercase leading-5 tracking-[0.08em] text-muted-foreground">
          {t("availabilityHelp")}
        </p>

        {values.availabilityVisible ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setPreset("weekdays", 2)}
                type="button"
                variant="outline"
              >
                {t("weekdaysPreset")}
              </Button>
              <Button
                onClick={() => setPreset("weekends", 4)}
                type="button"
                variant="outline"
              >
                {t("weekendsPreset")}
              </Button>
              <Button
                onClick={() => setPreset("clear")}
                type="button"
                variant="outline"
              >
                {t("clearAvailability")}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {availabilityDays.map((day) => (
                <label
                  className="grid grid-cols-[1fr_5rem] items-center gap-3"
                  htmlFor={`availability-${day}`}
                  key={day}
                >
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {directoryT(`days.${day}`)}
                  </span>
                  <Input
                    id={`availability-${day}`}
                    max={12}
                    min={0}
                    onChange={(event) => {
                      const nextHours = setDayHours(day, event.target.value);
                      // React skips re-syncing number inputs whose DOM value is
                      // numerically equal to state (e.g. "02" vs 2), so leading
                      // zeros stick around unless we normalize the DOM directly.
                      if (event.target.value !== String(nextHours)) {
                        event.target.value = String(nextHours);
                      }
                    }}
                    onFocus={(event) => event.target.select()}
                    type="number"
                    value={values.availability[day]}
                  />
                </label>
              ))}
            </div>

            <p className="font-mono text-sm font-bold uppercase tracking-[0.12em]">
              {t("hoursPerWeek", { hours: totalHours })}
            </p>
          </div>
        ) : null}
      </section>

      <Button
        className="h-12 text-sm uppercase tracking-[0.16em]"
        disabled={mutation.isPending}
        type="submit"
      >
        {mutation.isPending
          ? t("saving")
          : currentBuilder
            ? t("saveProfile")
            : t("publishProfile")}
      </Button>
    </form>
  );
}
