import Image from "next/image";
import { getVideoEmbedUrl } from "@/lib/projects/video-embed";
import { cn } from "@/lib/utils";

type ProjectVideoEmbedProps = {
  className?: string;
  detailHref?: string;
  imageUrl?: string;
  title: string;
  videoUrl: string;
};

export function ProjectVideoEmbed({
  className,
  detailHref,
  imageUrl,
  title,
  videoUrl,
}: ProjectVideoEmbedProps) {
  const embedUrl = getVideoEmbedUrl(videoUrl);

  if (!embedUrl) {
    if (imageUrl && !videoUrl) {
      const image = (
        <Image
          alt={`${title} project preview`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          src={imageUrl}
        />
      );

      return detailHref ? (
        <a
          className={cn(
            "relative block aspect-video overflow-hidden border border-border bg-card",
            className,
          )}
          href={detailHref}
        >
          {image}
        </a>
      ) : (
        <div
          className={cn(
            "relative aspect-video overflow-hidden border border-border bg-card",
            className,
          )}
        >
          {image}
        </div>
      );
    }

    const href = videoUrl || detailHref;
    const isExternal = Boolean(videoUrl);

    return href ? (
      <a
        className={cn(
          "flex aspect-video items-center justify-center border border-border bg-card font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary hover:text-primary",
          className,
        )}
        href={href}
        rel={isExternal ? "noreferrer" : undefined}
        target={isExternal ? "_blank" : undefined}
      >
        {videoUrl ? "Watch demo" : "View project"}
      </a>
    ) : null;
  }

  return (
    <div
      className={cn(
        "aspect-video overflow-hidden border border-border bg-card",
        className,
      )}
    >
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={embedUrl}
        title={`${title} demo video`}
      />
    </div>
  );
}
