import type { ComponentPropsWithoutRef } from "react";

type ProjectExternalLinkProps = Omit<
  ComponentPropsWithoutRef<"a">,
  "href" | "rel" | "target"
> & {
  href: string;
  sendReferrer?: boolean;
};

export function ProjectExternalLink({
  sendReferrer = false,
  ...props
}: ProjectExternalLinkProps) {
  return (
    <a
      {...props}
      rel={sendReferrer ? "noopener" : "noopener noreferrer"}
      target="_blank"
    />
  );
}
