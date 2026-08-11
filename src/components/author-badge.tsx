import Image from "next/image";
import { cn } from "@/lib/utils";

type AuthorBadgeProps = {
  name: string;
  imageUrl?: string;
  meta?: string;
  className?: string;
  imageClassName?: string;
  nameClassName?: string;
  metaClassName?: string;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "BV"
  );
}

export function AuthorBadge({
  name,
  imageUrl,
  meta,
  className,
  imageClassName,
  nameClassName,
  metaClassName,
}: AuthorBadgeProps) {
  return (
    <div
      className={cn("flex min-w-0 max-w-full items-center gap-3", className)}
    >
      {imageUrl ? (
        <Image
          alt=""
          className={cn(
            "size-10 shrink-0 rounded-full border border-border object-cover grayscale",
            imageClassName,
          )}
          height={40}
          src={imageUrl}
          unoptimized
          width={40}
        />
      ) : (
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card font-mono text-xs font-black uppercase tracking-[-0.04em] text-muted-foreground",
            imageClassName,
          )}
        >
          {initials(name)}
        </div>
      )}
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-mono text-sm font-bold uppercase tracking-[0.14em]",
            nameClassName,
          )}
        >
          {name}
        </p>
        {meta ? (
          <p
            className={cn(
              "mt-1 truncate font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground",
              metaClassName,
            )}
          >
            {meta}
          </p>
        ) : null}
      </div>
    </div>
  );
}
