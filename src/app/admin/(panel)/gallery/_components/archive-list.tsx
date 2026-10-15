import Image from 'next/image';

import { Badge } from '@/components/admin/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { ArchiveEntry } from '@/lib/schemas/archive';
import { categoryLabel } from '@/lib/schemas/category';

/**
 * The club archive, read-only: photos and clips committed to the repository
 * (`src/content/archive.json` and the files in `public/archive/`). The public
 * gallery shows them beside the club photos; they are changed in Git, never
 * here, so there is no form and no action. A server component, rendered
 * outside the data store's read, so it shows even when no store is set up.
 */
export function ArchiveList({ entries }: { entries: readonly ArchiveEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>
            Club archive <span className="text-muted-foreground">({entries.length})</span>
          </h2>
        </CardTitle>
        <CardDescription>
          Shown in the public gallery with the club photos. Edited in Git, not here: the list is
          src/content/archive.json and the files are in public/archive/.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState
            title="The archive is empty"
            description="Add entries to src/content/archive.json, with their files in public/archive/."
          />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
            {entries.map((entry) => (
              <li
                key={entry.src}
                className="flex flex-col overflow-hidden rounded-card border bg-background"
              >
                <div className="relative aspect-square bg-secondary">
                  <Image
                    src={entry.kind === 'video' ? entry.poster : entry.src}
                    alt={entry.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 64rem) 14rem, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{categoryLabel(entry.category)}</Badge>
                    {entry.kind === 'video' ? <Badge variant="secondary">Video</Badge> : null}
                  </div>
                  <p className="line-clamp-2 text-body-sm text-foreground">{entry.caption}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
