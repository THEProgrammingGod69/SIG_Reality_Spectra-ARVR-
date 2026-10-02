import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';
import type { Channels } from '@/lib/content';

type ChannelLinksProps = HTMLAttributes<HTMLUListElement> & { channels: Channels };

/**
 * The club's email and social links as a compact row (footer, mobile menu).
 * Renders nothing while no channel is set, so a placeholder never ships.
 * Plain markup with no hooks: usable from server and client components.
 */
export function ChannelLinks({ channels, className, ...rest }: ChannelLinksProps) {
  const { email, socials } = channels;
  if (!email && socials.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2 text-body-sm', className)} {...rest}>
      {email ? (
        <li>
          <a href={`mailto:${email}`} className="text-(--color-text)">
            {email}
          </a>
        </li>
      ) : null}
      {socials.map((social) => (
        <li key={social.href}>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--color-muted) hover:text-(--color-text)"
          >
            {social.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
