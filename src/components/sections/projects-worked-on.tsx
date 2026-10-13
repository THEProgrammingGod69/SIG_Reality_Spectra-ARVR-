'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { FlipCard } from '@/components/react-bits/flip-card/flip-card';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import projects from '@/content/projects.json';

type Project = (typeof projects)[number];

export function ProjectsWorkedOn() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [flipped, setFlipped] = useState<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        setEntered(visible);
        if (!visible) setFlipped(null);
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <Section labelledBy="projects-worked-on" className="relative isolate overflow-hidden">
      <div ref={sectionRef} className="w-full">
        <Heading level={2} id="projects-worked-on" className="text-display-lg">
          Projects We&apos;ve Worked On
        </Heading>
        <Text size="sm" tone="muted" className="mt-4">
          Click a card to reveal the story behind the project.
        </Text>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.name}
              project={project}
              entered={entered}
              flipped={flipped === index}
              onFlip={(next) => setFlipped(next ? index : null)}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

function ProjectCard({
  project,
  entered,
  flipped,
  onFlip,
}: {
  project: Project;
  entered: boolean;
  flipped: boolean;
  onFlip: (flipped: boolean) => void;
}) {
  return (
    <div className={entered ? 'animate-project-enter' : 'opacity-100'}>
      <FlipCard
        label={project.name}
        flipped={flipped}
        onFlip={onFlip}
        front={<ProjectFront project={project} />}
        back={<ProjectBack project={project} />}
      />
    </div>
  );
}

function ProjectFront({ project }: { project: Project }) {
  return (
    <div className="relative flex h-full flex-col justify-end bg-(--color-surface) p-6">
      <Image
        src={project.image}
        alt={project.imageAlt}
        fill
        sizes="(min-width: 768px) 33vw, 100vw"
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-(--color-void) via-transparent to-transparent opacity-90" />
      <div className="relative z-10">
        <h3 className="font-display text-display-sm text-(--color-text)">{project.name}</h3>
        <p className="mt-2 font-mono text-label text-(--color-silver) uppercase">Click to reveal</p>
      </div>
    </div>
  );
}

function ProjectBack({ project }: { project: Project }) {
  return (
    <div className="flex h-full flex-col justify-between bg-(--color-surface-raised) p-6">
      <div>
        <p className="font-mono text-label text-(--color-accent) uppercase">{project.name}</p>
        <h3 className="mt-4 font-display text-display-sm text-(--color-text)">{project.summary}</h3>
        <Text size="sm" className="mt-4">
          {project.details}
        </Text>
      </div>
      <div className="mt-6">
        <p className="font-mono text-label text-(--color-muted) uppercase">Technology</p>
        <ul className="mt-2 flex flex-wrap gap-2" aria-label={`${project.name} technologies`}>
          {project.technologies.map((technology) => (
            <li
              key={technology}
              className="rounded-full border border-(--color-border-strong) px-3 py-1 font-mono text-label text-(--color-silver)"
            >
              {technology}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
