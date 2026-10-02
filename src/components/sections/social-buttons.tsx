import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type { LiveSocial } from '@/lib/content';

type SocialButtonsProps = {
  socials: readonly LiveSocial[];
  className?: string;
};

/** A row of "Follow on Instagram"-style buttons for the channels that are set. */
export function SocialButtons({ socials, className }: SocialButtonsProps) {
  if (socials.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {socials.map((social) => (
        <ButtonLink key={social.id} href={social.href} external variant="secondary" size="sm">
          {social.action}
        </ButtonLink>
      ))}
    </div>
  );
}
