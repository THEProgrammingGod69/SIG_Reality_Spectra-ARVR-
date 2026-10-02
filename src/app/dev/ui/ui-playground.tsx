'use client';

import { ArrowRight, CalendarDays, Image as ImageIcon, Search, Sparkles } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button, ButtonLink, type ButtonSize, type ButtonVariant } from '@/components/ui/button';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardMedia,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Heading, type HeadingSize } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { BrandBadge, BrandMark } from '@/components/ui/logo';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Eyebrow, Text } from '@/components/ui/text';
import { contrastRatio, WCAG_AA_TEXT } from '@/lib/contrast';
import { readCssVar } from '@/lib/motion/tokens';

import { DevPageHeader, DevPanel } from '../_components/dev-panel';

const COLOUR_TOKENS = [
  'bg',
  'surface',
  'surface-raised',
  'border',
  'border-strong',
  'text',
  'text-body',
  'muted',
  'subtle',
  'silver',
  'accent',
  'success',
  'warning',
  'danger',
  'spectra-magenta',
  'spectra-orchid',
  'spectra-violet',
  'spectra-indigo',
  'spectra-azure',
  'spectra-blue',
  'spectra-cyan',
] as const;

/* Token hex values, read once in the browser for the contrast readout. */
let colourSnapshot: string | null = null;
function getColours() {
  colourSnapshot ??= JSON.stringify(
    Object.fromEntries(COLOUR_TOKENS.map((name) => [name, readCssVar(`--color-${name}`)])),
  );
  return colourSnapshot;
}
const noSubscribe = () => () => {};

const HEADING_SIZES: HeadingSize[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'star'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];
const TONES: BadgeTone[] = ['neutral', 'accent', 'success', 'warning', 'danger'];
const CARD_COUNTS = [0, 1, 3, 40] as const;

const LONG_TITLE =
  'An extremely long event title that an admin pasted in without thinking, to prove that a card clamps it at two lines, wraps unbroken words like Supercalifragilisticexpialidocious-and-then-some, and never pushes the grid out of shape no matter how much text arrives — it keeps going well past four hundred characters so the clamp, the ellipsis and the fixed media ratio are all visibly doing their job here.';

export function UiPlayground() {
  const coloursJson = useSyncExternalStore(noSubscribe, getColours, () => null);
  const colours = coloursJson ? (JSON.parse(coloursJson) as Record<string, string>) : null;
  const [cardCount, setCardCount] = useState<(typeof CARD_COUNTS)[number]>(3);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <DevPageHeader title="UI playground">
        Every design-system primitive in every state, on the real tokens. Change a value in
        globals.css and this page — and the whole site — follows.
      </DevPageHeader>

      <DevPanel title="Colour tokens · contrast on --color-bg">
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4">
          {COLOUR_TOKENS.map((name) => {
            const value = colours?.[name];
            const ratio = value && colours?.bg ? contrastRatio(value, colours.bg) : null;
            return (
              <li key={name} className="flex flex-col gap-2">
                <span
                  className="h-14 rounded-control border border-(--color-border)"
                  style={{ background: `var(--color-${name})` }}
                />
                <span className="font-mono text-label">--color-{name}</span>
                <span className="font-mono text-label text-(--color-muted)">
                  {value ?? '…'}
                  {ratio ? ` · ${ratio.toFixed(2)}:1${ratio >= WCAG_AA_TEXT ? ' AA' : ''}` : ''}
                </span>
              </li>
            );
          })}
        </ul>
      </DevPanel>

      <DevPanel title="Typography">
        <div className="flex flex-col gap-6">
          {HEADING_SIZES.map((size) => (
            <div key={size} className="flex flex-col gap-1">
              <Eyebrow>text-display-{size}</Eyebrow>
              <Heading level={3} size={size}>
                Cinematic XR lab
              </Heading>
            </div>
          ))}
          <div className="flex flex-col gap-3">
            <Eyebrow>text-body-lg · body · body-sm · label</Eyebrow>
            <Text size="lg">Large body — Inter, for intros and lead paragraphs.</Text>
            <Text>Body — the default reading size, never wider than the prose measure.</Text>
            <Text size="sm" tone="muted">
              Small body, muted — secondary information.
            </Text>
            <Text size="sm" tone="subtle">
              Subtle — captions and metadata only (D-003).
            </Text>
            <Eyebrow>Special Interest Group · VIT Pune</Eyebrow>
          </div>
        </div>
      </DevPanel>

      <DevPanel title="Buttons">
        <div className="flex flex-col gap-6">
          {VARIANTS.map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              <Eyebrow as="span" className="w-24">
                {variant}
              </Eyebrow>
              {SIZES.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  Size {size}
                </Button>
              ))}
              <Button variant={variant} icon={Sparkles}>
                Icon
              </Button>
              <Button variant={variant} disabled>
                Disabled
              </Button>
              <Button variant={variant} loading>
                Saving
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow as="span" className="w-24">
              links
            </Eyebrow>
            <ButtonLink href="/events" icon={ArrowRight} iconPosition="end" magnetic>
              Internal, magnetic
            </ButtonLink>
            <ButtonLink href="https://forms.google.com" external variant="star">
              Apply now
            </ButtonLink>
          </div>
        </div>
      </DevPanel>

      <DevPanel title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
          <Badge className="max-w-40">A very long category name that truncates</Badge>
        </div>
      </DevPanel>

      <DevPanel title="Cards · layout survives 0, 1, 3 and 40 items and a 400-character title">
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Number of cards">
          {CARD_COUNTS.map((count) => (
            <Button
              key={count}
              size="sm"
              variant={count === cardCount ? 'primary' : 'secondary'}
              aria-pressed={count === cardCount}
              onClick={() => setCardCount(count)}
            >
              {count} cards
            </Button>
          ))}
        </div>
        {cardCount === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="When the club announces its next event it will appear here."
          />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-6">
            {Array.from({ length: cardCount }, (_, i) => (
              <Card key={i} as="li" interactive featured={i === 0}>
                <CardMedia ratio={i % 2 === 0 ? '16/9' : '4/5'}>
                  <div className="absolute inset-0 flex items-center justify-center bg-(image:--gradient-spectra) opacity-20" />
                  <Icon
                    icon={ImageIcon}
                    size="lg"
                    className="absolute top-1/2 left-1/2 -translate-1/2 text-(--color-muted)"
                  />
                </CardMedia>
                <CardBody>
                  <Badge tone="accent" className="self-start">
                    Workshop
                  </Badge>
                  <CardTitle>{i === 0 ? LONG_TITLE : `Event number ${i + 1}`}</CardTitle>
                  <CardDescription>{i === 0 ? LONG_TITLE : 'A short description.'}</CardDescription>
                  <CardFooter>
                    <Text as="span" size="sm" tone="subtle">
                      12 Oct 2026
                    </Text>
                  </CardFooter>
                </CardBody>
              </Card>
            ))}
          </ul>
        )}
      </DevPanel>

      <div className="grid gap-6 md:grid-cols-2">
        <DevPanel title="Form fields">
          <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
            <Field label="Name" hint="As you would like us to address you." required>
              {(control) => <Input placeholder="Ada Lovelace" {...control} />}
            </Field>
            <Field label="Email" error="Enter an email address like name@example.com.">
              {(control) => <Input type="email" defaultValue="not-an-email" {...control} />}
            </Field>
            <Field label="Enquiry type">
              {(control) => (
                <Select defaultValue="sponsorship" {...control}>
                  <option value="sponsorship">Sponsorship</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="other">Other</option>
                </Select>
              )}
            </Field>
            <Field label="Message">
              {(control) => <Textarea placeholder="Tell us about it…" {...control} />}
            </Field>
            <Field label="Disabled">
              {(control) => <Input disabled defaultValue="Read only" {...control} />}
            </Field>
          </form>
        </DevPanel>

        <div className="flex flex-col gap-6">
          <DevPanel title="Modal">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
            <Modal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Delete this event?"
              description="Its photos are deleted too. This cannot be undone."
              footer={
                <>
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setModalOpen(false)}>Delete</Button>
                </>
              }
            >
              <Text size="sm" tone="muted">
                Escape, the close button or a click on the backdrop all dismiss it, and focus
                returns to the button that opened it.
              </Text>
            </Modal>
          </DevPanel>

          <DevPanel title="Skeleton">
            <div className="flex flex-col gap-3">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </DevPanel>

          <DevPanel title="Icons · Logo">
            <div className="flex flex-wrap items-center gap-4 text-(--color-silver)">
              <Icon icon={Search} size="sm" />
              <Icon icon={Search} size="md" />
              <Icon icon={Search} size="lg" />
              <Icon icon={Sparkles} size="lg" label="Featured" className="text-(--color-accent)" />
              <BrandMark />
              <BrandBadge />
            </div>
          </DevPanel>
        </div>
      </div>

      <DevPanel title="Shape and depth">
        <div className="flex flex-wrap gap-6">
          <div className="flex size-28 items-end rounded-control border border-(--color-border-strong) p-3 font-mono text-label">
            control
          </div>
          <div className="flex size-28 items-end rounded-card border border-(--color-border-strong) p-3 font-mono text-label">
            card
          </div>
          <div className="flex size-28 items-end rounded-card bg-(--color-surface-raised) p-3 font-mono text-label shadow-card">
            shadow-card
          </div>
          <div className="flex size-28 items-end rounded-card bg-(--color-surface-raised) p-3 font-mono text-label shadow-glow">
            shadow-glow
          </div>
          <div className="relative flex size-28 items-end overflow-hidden rounded-card border border-(--color-border) p-3 font-mono text-label before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-(image:--gradient-rim)">
            rim light
          </div>
        </div>
      </DevPanel>
    </div>
  );
}
