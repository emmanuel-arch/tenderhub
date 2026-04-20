"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Lazily-loaded backdrop image with a configurable scrim/overlay
 * (a "grey gradient" by default) so foreground text is always
 * legible. If the image fails to load (e.g. the user hasn't
 * downloaded the asset yet) the component renders only the
 * gradient backdrop so the page still looks intentional.
 */
export interface BackdropImageProps {
  src: string;
  alt?: string;
  /** Override the default grey scrim. Receives Tailwind classes. */
  overlayClass?: string;
  /** Apply additional positioning/sizing classes to the wrapper. */
  className?: string;
  /** Brand-tinted overlay colour for hover/active states. */
  tint?: string;
  priority?: boolean;
  rounded?: string;
}

export function BackdropImage({
  src,
  alt = "",
  overlayClass = "bg-gradient-to-br from-slate-900/80 via-slate-900/55 to-slate-950/85 dark:from-slate-950/85 dark:via-slate-950/65 dark:to-black/90",
  className = "absolute inset-0",
  tint,
  priority = false,
  rounded = "",
}: BackdropImageProps) {
  const [errored, setErrored] = useState(false);

  return (
    <div className={`pointer-events-none overflow-hidden ${rounded} ${className}`}>
      {!errored && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          priority={priority}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : null}
      <div className={`absolute inset-0 ${overlayClass}`} />
      {tint ? (
        <div
          className="absolute inset-0 mix-blend-multiply opacity-50"
          style={{
            background: `linear-gradient(135deg, ${tint}33 0%, transparent 60%, ${tint}55 100%)`,
          }}
        />
      ) : null}
    </div>
  );
}
