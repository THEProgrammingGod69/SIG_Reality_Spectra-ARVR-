import Image from 'next/image';

import badge from '@/assets/brand/logo-badge.png';
import mark from '@/assets/brand/logo-mark.png';
import { cn } from '@/lib/cn';
import { siteConfig } from '@/lib/site';

/**
 * The club logo, from the brand pack (references/brand). Both images are
 * raster artwork (the pack's SVGs only wrap the same PNG), so they go through
 * next/image: `sizes` matches the rendered size and the browser downloads a
 * small WebP/AVIF, never the master file.
 */

type LogoProps = {
  className?: string;
  /** Rendered width, for next/image's `sizes`. Keep it in step with the size class. */
  sizes?: string;
  /** Alt text. Pass `''` when visible text beside the logo already names the club. */
  alt?: string;
  /** Preload when the logo is part of the first paint (the header). */
  preload?: boolean;
};

/** The round headset mark — header, mobile menu, favicon source. */
export function BrandMark({
  className,
  sizes = '2.5rem',
  alt = `${siteConfig.name} logo`,
  preload = false,
}: LogoProps) {
  return (
    <Image
      src={mark}
      alt={alt}
      sizes={sizes}
      preload={preload}
      className={cn('size-10 shrink-0', className)}
    />
  );
}

/** The full badge with "VIT Pune · Reality Spectra · Special Interest Group" — footer. */
export function BrandBadge({
  className,
  sizes = '6rem',
  alt = `${siteConfig.name} — ${siteConfig.kind}, ${siteConfig.parentOrganisation}`,
  preload = false,
}: LogoProps) {
  return (
    <Image
      src={badge}
      alt={alt}
      sizes={sizes}
      preload={preload}
      className={cn('size-24 shrink-0', className)}
    />
  );
}
