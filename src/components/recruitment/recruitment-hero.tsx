'use client';

import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

type DynamicComponent = ComponentType<Record<string, unknown>>;

const Hyperspeed = dynamic(
  () =>
    import('./hyperspeed').then(
      mod => (mod.Hyperspeed || mod.default) as unknown as DynamicComponent
    ),
  { ssr: false }
);

export function RecruitmentHero() {
  return (
    <section className="reference-page-hero reference-section recruitment-hero">
      <div id="recruitment-hyperspeed-root" className="recruitment-hyperspeed" aria-hidden="true">
        <Hyperspeed
          curve="winding"
          curvature={0.72}
          speed={0.82}
          density={28}
          trailLength={0.95}
          lightSize={0.92}
          poles={10}
          dust={42}
          glow={0.52}
          reflections={0.36}
          roadOpacity={0.18}
          roadColor="#100a1e"
          lineColor="#7650aa"
          tailColors={['#df7bff', '#a07aff', '#ff70bb']}
          headColors={['#73f1ff', '#6b91ff', '#d095ff']}
          poleColors={['#7deaff']}
          interactive={false}
          className="recruitment-hyperspeed-effect"
        />
      </div>
      <div className="recruitment-hero-ambience" aria-hidden="true" />
      <div className="recruitment-hero-copy">
        <span className="badge badge-spectrum" style={{ marginBottom: '1rem' }}>
          <span className="pulsing-dot" />
          Join The Spectra Team
        </span>
        <h1 style={{ color: '#FFFFFF', marginBottom: '1.25rem' }}>
          Build beyond <span className="text-gradient">reality.</span>
        </h1>
        <p style={{ color: 'var(--color-muted, #94a3b8)', fontSize: '1.15rem', lineHeight: '1.65' }}>
          Shape immersive worlds with SIG Reality Spectra at VIT Pune. Find your track and create what comes next.
        </p>
        <Link className="reference-button primary recruitment-hero-cta" href="#domains-section">
          Explore the tracks <span aria-hidden="true">↓</span>
        </Link>
      </div>
    </section>
  );
}

export default RecruitmentHero;
