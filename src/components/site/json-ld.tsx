import { jsonLdScript } from '@/lib/structured-data';

/**
 * schema.org structured data for search engines, as a JSON-LD script tag.
 * The data comes from validated content or records, and `jsonLdScript`
 * escapes it so no value can close the tag early.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
  );
}
