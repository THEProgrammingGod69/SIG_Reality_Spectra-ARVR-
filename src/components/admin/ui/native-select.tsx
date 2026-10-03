import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

/**
 * A styled native `<select>` (in-house, D-031): the platform's own picker is
 * the most accessible one on phones, and needs no JavaScript.
 */
function NativeSelect({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          'h-9 w-full cursor-pointer appearance-none rounded-control border border-input bg-background ps-3 pe-9 text-body-sm text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
          'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <Icon
        icon={ChevronDown}
        size="sm"
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { NativeSelect };
