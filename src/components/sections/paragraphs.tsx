import { cn } from '@/lib/cn';

/**
 * Admin-written text (an event's description or recap) as paragraphs: a blank
 * line starts a new one, a single line break stays a line break. Rendered as
 * plain text — never as HTML — so nothing an admin types can inject markup.
 */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="wrap-anywhere whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
