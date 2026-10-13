'use client';

import { useEffect, useRef, useState } from 'react';

import { MagicBento } from '@/components/react-bits/magic-bento/magic-bento';
import { SplitFlapText } from '@/components/react-bits/split-flap-text/split-flap-text';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export function WhoWeAreContent() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={contentRef} className="max-w-3xl">
      <Heading level={2} id="about-intro" className="text-display-lg uppercase">
        <SplitFlapText text="WHO WE ARE" start={entered} />
      </Heading>
      <MagicBento className="mt-10 max-w-2xl">
        <div className="flex flex-col gap-4 p-8 sm:p-10">
          <h3 className="font-display text-display-sm text-(--color-text)">
            About Reality Spectra
          </h3>
          <Text size="lg">
            Reality Spectra is the official AR/VR/XR Special Interest Group of VIT Pune, bringing
            students together to explore immersive technologies and creative possibilities.
          </Text>
        </div>
      </MagicBento>
    </div>
  );
}
