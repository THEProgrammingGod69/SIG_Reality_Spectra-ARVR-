import { ArrowUpRight, LoaderCircle, type LucideIcon } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react';

import { Magnetic } from '@/components/motion/magnetic';
import { cn } from '@/lib/cn';

import { Icon, type IconSize } from './icon';

/**
 * Button and ButtonLink — one look for every call to action.
 *
 *   primary   — the main action (accent fill)
 *   secondary — an alternative action (outline)
 *   ghost     — low-emphasis actions (text only)
 *   star      — the highlighted CTA ("Apply now", current event), our version of
 *               React Bits' StarBorder: two light points travel the border
 *
 * Motion obeys rule 4: hover fades an overlay (`opacity`), press scales
 * (`transform`), and the primary fill catches a glare (`transform`); colours
 * never transition. `magnetic` adds the Magnetic pull.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'star';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full font-medium whitespace-nowrap select-none transition-transform duration-(--dur-micro) ease-out-expo active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ' +
  // Hover/focus overlay, painted between the fill and the label.
  'before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-(--dur-micro) hover:before:opacity-100 focus-visible:before:opacity-100';

/**
 * The primary button's glare (our GlareHover, D-037): a skewed band of light
 * that sweeps across once as the pointer arrives. `transform` only, behind the
 * label; it moves with a transition on the way in and snaps back unseen on the
 * way out (the resting state has no transition).
 */
const glare =
  'after:absolute after:inset-y-0 after:left-0 after:-z-10 after:w-1/3 after:-translate-x-full after:-skew-x-12 after:bg-linear-to-r after:from-transparent after:via-(--color-text)/45 after:to-transparent ' +
  'hover:after:translate-x-[300%] hover:after:transition-transform hover:after:duration-(--dur-long) hover:after:ease-out-expo';

const variants: Record<ButtonVariant, string> = {
  primary: `bg-(--color-accent) text-(--color-accent-contrast) before:bg-(--color-text)/20 ${glare}`,
  secondary: 'border border-(--color-border-strong) text-(--color-text) before:bg-(--color-text)/8',
  ghost: 'text-(--color-muted) hover:text-(--color-text) before:bg-(--color-text)/6',
  star: 'p-px text-(--color-text) before:hidden',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-body-sm',
  md: 'h-11 px-6 text-body-sm',
  lg: 'h-13 px-7 text-body',
};

const iconSizes: Record<ButtonSize, IconSize> = { sm: 'sm', md: 'sm', lg: 'md' };

function rootClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  // The star variant sizes its inner surface, so its border ring stays 1px.
  return cn(base, variants[variant], variant !== 'star' && sizes[size], className);
}

type ContentProps = {
  variant: ButtonVariant;
  size: ButtonSize;
  icon?: LucideIcon | undefined;
  iconPosition: 'start' | 'end';
  loading?: boolean;
  external?: boolean;
  children: ReactNode;
};

function Content({ variant, size, icon, iconPosition, loading, external, children }: ContentProps) {
  const iconSize = iconSizes[size];
  const label = (
    <>
      {loading ? (
        <Icon icon={LoaderCircle} size={iconSize} className="animate-spin-slow" />
      ) : icon && iconPosition === 'start' ? (
        <Icon icon={icon} size={iconSize} />
      ) : null}
      {children}
      {icon && iconPosition === 'end' && !loading ? <Icon icon={icon} size={iconSize} /> : null}
      {external ? (
        <>
          <Icon icon={ArrowUpRight} size={iconSize} />
          <span className="sr-only">(opens in a new tab)</span>
        </>
      ) : null}
    </>
  );

  if (variant !== 'star') return label;

  return (
    <>
      <span
        aria-hidden="true"
        className="absolute -right-[250%] -bottom-2.5 z-0 h-1/2 w-[300%] animate-star-bottom rounded-full bg-[radial-gradient(circle,var(--color-spectra-orchid),transparent_10%)] opacity-70"
      />
      <span
        aria-hidden="true"
        className="absolute -top-2.5 -left-[250%] z-0 h-1/2 w-[300%] animate-star-top rounded-full bg-[radial-gradient(circle,var(--color-spectra-azure),transparent_10%)] opacity-70"
      />
      <span
        className={cn(
          'relative z-10 inline-flex items-center justify-center gap-2 rounded-full border border-(--color-border-strong) bg-(--color-surface)',
          sizes[size],
        )}
      >
        {label}
      </span>
    </>
  );
}

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'start' | 'end';
  /** Pull toward a nearby mouse pointer (Magnetic). Use on one primary CTA per view. */
  magnetic?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    /** Shows a spinner, disables the button and sets aria-busy. */
    loading?: boolean;
    ref?: Ref<HTMLButtonElement>;
  };

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  magnetic = false,
  loading = false,
  className,
  children,
  type = 'button',
  disabled,
  ...rest
}: ButtonProps) {
  const button = (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={rootClasses(variant, size, className)}
      {...rest}
    >
      <Content
        variant={variant}
        size={size}
        icon={icon}
        iconPosition={iconPosition}
        loading={loading}
      >
        {children}
      </Content>
    </button>
  );

  return magnetic ? <Magnetic>{button}</Magnetic> : button;
}

type ButtonLinkProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> &
  (
    | {
        /** A typed site route (typo-checked by `typedRoutes`). */
        href: Route;
        external?: false;
      }
    | {
        /** Any absolute URL, e.g. one from src/content. */
        href: string;
        /** Opens in a new tab with `rel="noopener noreferrer"` and an ↗ cue. */
        external: true;
      }
  );

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  magnetic = false,
  external = false,
  className,
  children,
  href,
  ...rest
}: ButtonLinkProps) {
  const classes = rootClasses(variant, size, className);
  const content = (
    <Content
      variant={variant}
      size={size}
      icon={icon}
      iconPosition={iconPosition}
      external={external}
    >
      {children}
    </Content>
  );

  const link = external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
      {content}
    </a>
  ) : (
    // Internal by the union above, so `href` is a typed Route here.
    <Link href={href as Route} className={classes} {...rest}>
      {content}
    </Link>
  );

  return magnetic ? <Magnetic>{link}</Magnetic> : link;
}
