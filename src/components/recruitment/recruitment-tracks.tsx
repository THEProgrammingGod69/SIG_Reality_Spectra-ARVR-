'use client';

import React, { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DomainList } from '@/components/sections/domain-list';
import './recruitment-tracks.css';

type DynamicComponent = React.ComponentType<Record<string, unknown>>;

const Lanyard = dynamic(
  () => import('./lanyard').then(mod => (mod.Lanyard || mod.default) as unknown as DynamicComponent),
  { ssr: false }
);
const LightRays = dynamic(
  () => import('./light-rays').then(mod => (mod.LightRays || mod.default) as unknown as DynamicComponent),
  { ssr: false }
);
const InfiniteMenu = dynamic(
  () => import('./infinite-menu').then(mod => (mod.InfiniteMenu || mod.default) as unknown as DynamicComponent),
  { ssr: false }
);
const PixelCard = dynamic(
  () => import('./pixel-card').then(mod => (mod.PixelCard || mod.default) as unknown as DynamicComponent),
  { ssr: false }
);
const FolderFloat = dynamic(
  () => import('./folder-float').then(mod => (mod.FolderFloat || mod.default) as unknown as DynamicComponent),
  { ssr: false }
);

const sigLogo = '/assets/images/sig-logo.jpeg';

export type Track = {
  id: string;
  title: string;
  role: string;
  idPortrait: string;
  menuImage: string;
  icon: string;
  description: string;
  technologies: string[];
  accent: string;
};

export const tracks: Track[] = [
  {
    id: 'web-development',
    title: 'Web Development',
    role: 'Web Dev Coordinator',
    idPortrait: '/assets/images/recruitment-ids/web-development.png',
    menuImage: '/assets/images/recruitment-menu/web-development.jpg',
    icon: '⌘',
    description: 'Build and maintain responsive websites and web applications, working on frontend interfaces, backend logic, database integration, and interactive user experiences.',
    technologies: ['HTML & CSS', 'JavaScript', 'React', 'Node.js', 'Databases'],
    accent: '#68a8ff'
  },
  {
    id: 'training-workshops',
    title: 'Training & Workshop',
    role: 'Workshop Coordinator',
    idPortrait: '/assets/images/recruitment-ids/training-workshop.png',
    menuImage: '/assets/images/recruitment-menu/training-workshop.jpg',
    icon: '◎',
    description: 'Organize technical workshops, hands-on sessions, and learning programs to introduce members to XR technologies, development tools, and emerging technologies.',
    technologies: ['Unity', 'Blender', 'XR Tools', 'Presentation Tools'],
    accent: '#56e0c1'
  },
  {
    id: 'xr-development',
    title: 'XR Development',
    role: 'XR Development Coordinator',
    idPortrait: '/assets/images/recruitment-ids/xr-development.png',
    menuImage: '/assets/images/recruitment-menu/xr-development.jpg',
    icon: '◉',
    description: 'Develop immersive Augmented Reality, Virtual Reality, and Mixed Reality experiences, including interactive environments, simulations, spatial interfaces, and 3D applications.',
    technologies: ['Unity 3D', 'Unreal Engine', 'C#', 'OpenXR', 'ARCore / ARKit'],
    accent: '#ad82ff'
  },
  {
    id: 'management',
    title: 'Management',
    role: 'Management Coordinator',
    idPortrait: '/assets/images/recruitment-ids/management.png',
    menuImage: '/assets/images/recruitment-menu/management.jpg',
    icon: '▤',
    description: 'Coordinate club operations, plan activities, manage teams and timelines, and ensure that projects, events, and collaborations run smoothly from planning to execution.',
    technologies: ['Notion', 'Trello', 'Google Workspace', 'Project Planning'],
    accent: '#ffc45f'
  },
  {
    id: 'publicity-outreach',
    title: 'Publicity & Outreach',
    role: 'Outreach Coordinator',
    idPortrait: '/assets/images/recruitment-ids/outreach.png',
    menuImage: '/assets/images/recruitment-menu/outreach.jpg',
    icon: '↗',
    description: "Promote club activities, reach new audiences, coordinate campaigns, and build connections with students, communities, and external organizations to expand the club's visibility.",
    technologies: ['Instagram', 'LinkedIn', 'Canva', 'Campaign Planning'],
    accent: '#ff7a67'
  },
  {
    id: 'multimedia-management',
    title: 'Multimedia',
    role: 'Multimedia Coordinator',
    idPortrait: '/assets/images/recruitment-ids/multimedia.png',
    menuImage: '/assets/images/recruitment-menu/multimedia.jpg',
    icon: '◫',
    description: 'Create engaging visual content for the club, including event photography, video production, promotional edits, motion graphics, and creative coverage of activities.',
    technologies: ['Photoshop', 'After Effects'],
    accent: '#ff71b6'
  },
  {
    id: 'content-social-media',
    title: 'Content & Social Media',
    role: 'Content Coordinator',
    idPortrait: '/assets/images/recruitment-ids/content-social.png',
    menuImage: '/assets/images/recruitment-menu/content-social.jpg',
    icon: '✳',
    description: 'Craft compelling captions, articles, announcements, and creative copy while managing social media content, maintaining a consistent brand voice, and planning publishing schedules.',
    technologies: ['Instagram', 'LinkedIn', 'Canva'],
    accent: '#65ccff'
  },
  {
    id: 'finance',
    title: 'Finance',
    role: 'Finance Coordinator',
    idPortrait: '/assets/images/recruitment-ids/finance.png',
    menuImage: '/assets/images/recruitment-menu/finance.jpg',
    icon: '◈',
    description: 'Manage budgets, track expenses, maintain financial records, prepare event cost estimates, and support transparent financial planning for club activities and projects.',
    technologies: ['Google Sheets', 'Budget Planning', 'Financial Reporting'],
    accent: '#81d98a'
  },
  {
    id: 'pr-sponsorship',
    title: 'PR & Sponsorship',
    role: 'Sponsorship Coordinator',
    idPortrait: '/assets/images/recruitment-ids/sponsorship.png',
    menuImage: '/assets/images/recruitment-menu/sponsorship.jpg',
    icon: '⟡',
    description: 'Build professional relationships with companies, sponsors, speakers, and partner organizations while preparing proposals, coordinating collaborations, and managing external communications.',
    technologies: ['LinkedIn', 'Google Workspace', 'Proposal Writing', 'Communication'],
    accent: '#ffae62'
  },
  {
    id: 'aesthetics',
    title: 'Aesthetics',
    role: 'Aesthetics Coordinator',
    idPortrait: '/assets/images/recruitment-ids/aesthetics.png',
    menuImage: '/assets/images/recruitment-menu/aesthetics.jpg',
    icon: '✣',
    description: "Shape the club's visual identity through graphic design, posters, event creatives, UI concepts, branding assets, and consistent visual styles across digital and physical platforms.",
    technologies: ['Canva', 'Photoshop'],
    accent: '#e7d767'
  }
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function useMemberCardTexture(track: Track, trackNumber: number) {
  const [texture, setTexture] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadImage(track.idPortrait),
      loadImage(sigLogo)
    ]).then(([portrait, logo]) => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 960;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Keep the full domain artwork visible, with a little breathing room inside the card.
      ctx.fillStyle = '#a1a6d8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const imageScale = Math.min((canvas.width * 0.9) / portrait.width, (canvas.height * 0.9) / portrait.height);
      const imageWidth = portrait.width * imageScale;
      const imageHeight = portrait.height * imageScale;
      const imageX = (canvas.width - imageWidth) / 2;
      const imageY = (canvas.height - imageHeight) / 2;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(portrait, imageX, imageY, imageWidth, imageHeight);
      const wash = ctx.createLinearGradient(0, 0, 0, 960);
      wash.addColorStop(0, 'rgba(8, 10, 19, .58)');
      wash.addColorStop(0.38, 'rgba(8, 10, 19, .02)');
      wash.addColorStop(0.62, 'rgba(8, 10, 19, .06)');
      wash.addColorStop(1, 'rgba(8, 10, 19, .94)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, 640, 960);

      // Place the supplied club mark on the portrait as a stitched member patch.
      ctx.save();
      ctx.beginPath();
      ctx.arc(245, 700, 34, 0, Math.PI * 2);
      ctx.fillStyle = '#f7f6ff';
      ctx.fill();
      ctx.clip();
      ctx.drawImage(logo, 211, 666, 68, 68);
      ctx.restore();
      ctx.strokeStyle = track.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(245, 700, 36, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = track.accent;
      ctx.fillRect(0, 0, 640, 9);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.font = '600 19px Arial, sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('SIG  /  REALITY SPECTRA', 38, 60);
      ctx.fillStyle = 'rgba(255,255,255,.68)';
      ctx.font = '600 15px Arial, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText(`MEMBER ID     RS-${String(trackNumber).padStart(2, '0')}`, 38, 91);
      ctx.fillStyle = track.accent;
      ctx.fillRect(38, 805, 54, 4);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 34px Arial, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(track.role, 38, 863, 564);
      ctx.fillStyle = 'rgba(255,255,255,.66)';
      ctx.font = '500 17px Arial, sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText(track.title.toUpperCase(), 38, 900, 564);
      ctx.fillStyle = 'rgba(255,255,255,.48)';
      ctx.font = '500 13px Arial, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('VIT PUNE  •  REALITY SPECTRA', 38, 934);

      if (!cancelled) setTexture(canvas.toDataURL('image/png'));
    }).catch(error => console.error('Could not prepare SIG member card:', error));

    return () => { cancelled = true; };
  }, [track, trackNumber]);

  return texture;
}

function TrackOverview({ onSelect }: { onSelect: (track: Track) => void }) {
  const items = tracks.map(track => ({
    image: track.menuImage,
    title: track.title,
    description: track.description
  }));

  return (
    <div className="tracks-shell">
      <header className="tracks-heading">
        <div className="tracks-eyebrow"><span /> SPECIALISATION TRACKS</div>
        <h2>Find your <em>dimension.</em></h2>
        <p>Ride through the teams shaping what comes next. Select a domain to see how you can contribute.</p>
      </header>
      <div className="track-orbit-shell">
        <InfiniteMenu
          items={items}
          count={items.length}
          tileSize={0.84}
          roundness={0.16}
          zoom={1.55}
          pullBack={0.85}
          stretch={0.45}
          inertia={0.58}
          autoplay={3.2}
          grayscale={false}
          dim={0.2}
          intro
          showInfo
          showNavigation
          theme="dark"
          accentColor="#a75cff"
          onItemClick={(item: { title: string }) => {
            const track = tracks.find(candidate => candidate.title === item.title);
            if (track) onSelect(track);
          }}
          className="tracks-infinite-menu"
        />
      </div>
      <div className="track-navigation" aria-label="Quick navigate to a specialization track">
        <div className="track-navigation-label"><span>QUICK NAVIGATE</span><span>10 DOMAINS</span></div>
        <div className="track-navigation-list">
          {tracks.map((track, index) => (
            <button
              key={track.title}
              type="button"
              style={{ '--track-accent': track.accent } as React.CSSProperties}
              onClick={() => onSelect(track)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>{track.title}<i aria-hidden="true">↗</i>
            </button>
          ))}
        </div>
      </div>
      <p className="track-menu-hint">Use the arrows to switch domains · drag to spin · select “Explore track” to enter</p>
    </div>
  );
}

function TrackDetail({
  track,
  onBack,
  onSelectTrack
}: {
  track: Track;
  onBack: () => void;
  onSelectTrack: (track: Track) => void;
}) {
  const index = tracks.findIndex(t => t.id === track.id || t.title === track.title);
  const [selectedTech, setSelectedTech] = useState('');
  const memberCardTexture = useMemberCardTexture(track, index + 1);

  useEffect(() => {
    const target = document.getElementById('domains-section') || document.getElementById('recruitment-tracks-root');
    if (target) {
      const headerOffset = 76;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      });
    }
  }, [track]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onBack();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  const cardFrontImage = memberCardTexture || track.idPortrait;

  return (
    <article className="track-detail" style={{ '--track-accent': track.accent } as React.CSSProperties}>
      <div className="track-detail-rays" aria-hidden="true">
        <Suspense fallback={null}>
          <LightRays
            raysOrigin="top-center"
            raysColor={track.accent}
            raysSpeed={0.8}
            lightSpread={0.85}
            rayLength={1.35}
            followMouse={false}
            mouseInfluence={0}
            noiseAmount={0.025}
            distortion={0.025}
            saturation={1.2}
          />
        </Suspense>
      </div>
      <div className="track-detail-topline">
        <button className="track-back" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> All tracks
        </button>
        <span className="track-count">TRACK {String(index + 1).padStart(2, '0')} <i>/</i> 10</span>
      </div>
      <div className="track-detail-grid">
        <div className="track-copy-column">
          <div className="track-copy-kicker">SIG REALITY SPECTRA <span>•</span> SPECIALISATION</div>
          <h2>{track.title}</h2>
          <PixelCard
            className="track-info-card track-info-pixel-card"
            colors={[track.accent, '#d8c7ff', '#ffffff']}
            glowColor={track.accent}
            shape="square"
            origin="pointer"
            gap={6}
            pixelSize={2.2}
            speed={22}
            revealDuration={700}
            spotlight={0.35}
            glow={0.32}
            opacity={0.3}
            fade={0.55}
            trigger="hover"
            clickPulse
            intro
            theme="dark"
            radius={20}
            style={{ '--track-accent': track.accent } as React.CSSProperties}
          >
            <div className="track-info-card-head">
              <span className="track-info-mark">{track.icon}</span>
              <span>THE MISSION</span>
              <span className="track-info-index">RS / {String(index + 1).padStart(2, '0')}</span>
            </div>
            <p>{track.description}</p>
            <div className="track-info-card-bottom">
              <span>REALITY SPECTRA</span>
              <span>VIT PUNE</span>
            </div>
          </PixelCard>
          <div className="track-tools-heading">
            <div>
              <span className="track-copy-kicker">YOUR TOOLKIT</span>
              <h3>Key technologies</h3>
            </div>
            <span className="track-tools-count">{String(track.technologies.length).padStart(2, '0')} TOOLS</span>
          </div>
          <div className="track-folder-wrap">
            <FolderFloat
              items={track.technologies}
              label="Open toolkit"
              sublabel={`${track.technologies.length} technologies`}
              trigger="click"
              closeOnSelect={false}
              physics={false}
              drift={0}
              onSelect={(value: string) => setSelectedTech(value)}
              folderColor={track.accent}
              frontColor={track.accent}
              paperColor="#f4efff"
              itemColor="#fcf9ff"
              itemTextColor="#1b1730"
              labelColor="#fff"
              width={220}
              height={154}
              spread={210}
              lift={38}
            />
            <div className="folder-instruction">Click the folder to reveal the technologies</div>
            {selectedTech && <div className="tool-selection" aria-live="polite">Selected <strong>{selectedTech}</strong></div>}
          </div>
        </div>
        <aside className="track-id-column" aria-label="SIG Reality Spectra identity card">
          <div className="lanyard-caption">
            <span className="lanyard-caption-dot" style={{ backgroundColor: track.accent }} />
            MEMBER IDENTITY
            <span className="lanyard-caption-line" />
          </div>
          <div className="track-lanyard-stage">
            <Suspense fallback={<div className="lanyard-loading">PREPARING MEMBER ID</div>}>
              <Lanyard
                frontImage={cardFrontImage}
                backImage={sigLogo}
                imageFit="contain"
                cardColor="#10111d"
                orientation="portrait"
                finish="matte"
                size={0.68}
                anchor="center"
                strapLength={0.31}
                strapColor={track.accent}
                metal="silver"
                gravity={0.75}
                damping={0.58}
                elasticity={0.54}
                breeze={0.28}
                interactive
                intro
              />
            </Suspense>
          </div>
          <div className="id-helper">
            DRAG TO SWING <span>·</span> CLICK TO FLIP
          </div>
          <div className="track-id-stamp">
            <span>RS</span>
            <span>
              REALITY SPECTRA
              <br />
              VIT PUNE · EST. 2016
            </span>
            <span>✳</span>
          </div>
        </aside>
      </div>

      <div className="track-detail-switcher" aria-label="Quick switch to another track">
        <div className="track-switcher-label">
          <span>SWITCH TRACK</span>
          <span>10 SPECIALISATIONS</span>
        </div>
        <div className="track-switcher-list">
          {tracks.map((t, i) => (
            <button
              key={t.title}
              type="button"
              className={t.id === track.id ? 'active' : ''}
              style={{ '--track-accent': t.accent } as React.CSSProperties}
              onClick={() => onSelectTrack(t)}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {t.title}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

export function RecruitmentTracks() {
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);

  const handleSelect = (track: Track) => {
    setActiveTrack(track);
    const target = document.getElementById('domains-section') || document.getElementById('recruitment-tracks-root');
    if (target) {
      const headerOffset = 76;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      });
    }
  };

  const handleBack = () => {
    setActiveTrack(null);
    const target = document.getElementById('domains-section') || document.getElementById('recruitment-tracks-root');
    if (target) {
      const headerOffset = 76;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      });
    }
  };

  const handleDomainSelect = (trackName: string) => {
    const found = tracks.find(
      t =>
        t.title.toLowerCase().includes(trackName.toLowerCase()) ||
        trackName.toLowerCase().includes(t.title.toLowerCase())
    );
    if (found) {
      handleSelect(found);
    }
  };

  return (
    <>
      <section className="reference-section recruitment-tracks-section" id="domains-section">
        <div id="recruitment-tracks-root" className="tracks-experience">
          {activeTrack ? (
            <TrackDetail
              key={activeTrack.title}
              track={activeTrack}
              onBack={handleBack}
              onSelectTrack={handleSelect}
            />
          ) : (
            <TrackOverview onSelect={handleSelect} />
          )}
        </div>
      </section>
      {!activeTrack && <DomainList onSelectTrack={handleDomainSelect} />}
    </>
  );
}

export default RecruitmentTracks;
