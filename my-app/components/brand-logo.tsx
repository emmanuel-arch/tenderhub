"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * A bank/provider logomark. If the supplied {src} 404s we
 * gracefully fall back to a coloured tile with the institution's
 * monogram (e.g. "KCB", "EQ"). This lets the platform ship before
 * every brand asset has been downloaded.
 */
export interface BrandLogoProps {
  src?: string | null;
  fallbackText: string;
  accent: string;
  /** Tailwind size classes, e.g. "h-12 w-12". */
  sizeClass?: string;
  /** Tailwind rounding, e.g. "rounded-2xl". */
  roundedClass?: string;
  /** Override text colour. Defaults to white on the accent tile. */
  textClass?: string;
  alt?: string;
}

export function BrandLogo({
  src,
  fallbackText,
  accent,
  sizeClass = "h-12 w-12",
  roundedClass = "rounded-2xl",
  textClass = "text-white",
  alt,
}: BrandLogoProps) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;

  return (
    <div
      className={`relative flex flex-shrink-0 items-center justify-center overflow-hidden font-display shadow-lg ${sizeClass} ${roundedClass} ${textClass}`}
      style={{ backgroundColor: accent }}
    >
      {showImage ? (
        <Image
          src={src!}
          alt={alt ?? fallbackText}
          fill
          sizes="64px"
          className="object-contain p-1.5"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="text-sm leading-none">{fallbackText}</span>
      )}
    </div>
  );
}
