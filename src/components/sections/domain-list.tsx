'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';
import type { DomainGroup } from '@/lib/content';

export type DomainListProps = {
  groups?: readonly DomainGroup[];
  onSelectTrack?: (trackTitle: string) => void;
};

const DOMAIN_DATA = [
  {
    category: 'Technical',
    badgeTone: 'accent' as const,
    accent: '#68a8ff',
    items: [
      { number: '01', name: 'Training & Workshop', role: 'Workshop Coordinator', tools: ['Unity', 'Blender', 'XR Tools'] },
      { number: '02', name: 'Web Development', role: 'Web Dev Coordinator', tools: ['React', 'Next.js', 'Node.js', 'TypeScript'] },
      { number: '03', name: 'XR Development', role: 'XR Development Coordinator', tools: ['Unity 3D', 'Unreal Engine', 'OpenXR', 'C#'] }
    ]
  },
  {
    category: 'Non-Technical',
    badgeTone: 'neutral' as const,
    accent: '#ad82ff',
    items: [
      { number: '04', name: 'Management', role: 'Management Coordinator', tools: ['Notion', 'Trello', 'Team Planning'] },
      { number: '05', name: 'Publicity & Outreach', role: 'Outreach Coordinator', tools: ['Campaigns', 'Instagram', 'Outreach'] },
      { number: '06', name: 'Multimedia', role: 'Multimedia Coordinator', tools: ['After Effects', 'Photoshop', 'Video Production'] },
      { number: '07', name: 'Content & Social Media', role: 'Content Coordinator', tools: ['Copywriting', 'Social Strategy', 'Canva'] },
      { number: '08', name: 'Finance', role: 'Finance Coordinator', tools: ['Google Sheets', 'Budget Planning', 'Finance'] },
      { number: '09', name: 'PR & Sponsorship', role: 'Sponsorship Coordinator', tools: ['Corporate PR', 'Proposals', 'Communications'] },
      { number: '10', name: 'Aesthetics', role: 'Aesthetics Coordinator', tools: ['Visual Identity', 'Graphic Design', 'UI Concepts'] }
    ]
  }
];

export function DomainList({ onSelectTrack }: DomainListProps) {
  const handleTrackClick = (trackName: string) => {
    if (onSelectTrack) {
      onSelectTrack(trackName);
    } else {
      const section = document.getElementById('domains-section') || document.getElementById('recruitment-tracks-root');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <Section labelledBy="domains-title" id="domains" className="scroll-mt-header !py-8 md:!py-12">
      <div className="flex flex-col items-center text-center">
        <Eyebrow>SPECIALISATION DIRECTORY</Eyebrow>
        <Heading level={2} id="domains-title" className="mt-2 text-2xl sm:text-3xl font-bold">
          Technical &amp; Non-Technical Domains
        </Heading>
        <Text tone="muted" size="sm" className="mt-2 max-w-lg">
          Explore all 10 specialization tracks at SIG Reality Spectra with key technologies and coordinator roles.
        </Text>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {DOMAIN_DATA.map((group) => (
          <div key={group.category} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Heading level={3} size="sm" className="text-base sm:text-lg font-semibold text-white">
                {group.category} Domains
              </Heading>
              <Badge tone={group.badgeTone} className="text-xs">
                {group.items.length} Tracks
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-md shadow-xl">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04] text-xs font-mono tracking-wider text-white/50 uppercase">
                    <th scope="col" className="py-3 px-4 w-14">#</th>
                    <th scope="col" className="py-3 px-4">Domain Track</th>
                    <th scope="col" className="py-3 px-4">Coordinator Role</th>
                    <th scope="col" className="py-3 px-4">Core Toolkit</th>
                    <th scope="col" className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {group.items.map((item) => (
                    <tr
                      key={item.name}
                      className="group transition-colors hover:bg-white/[0.04]"
                    >
                      <td className="py-3 px-4 font-mono text-xs font-semibold" style={{ color: group.accent }}>
                        {item.number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-white/70 text-xs">
                        {item.role}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {item.tools.map((tool) => (
                            <span
                              key={tool}
                              className="inline-block rounded-md bg-white/[0.06] border border-white/5 px-2 py-0.5 text-[11px] font-mono text-white/80"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleTrackClick(item.name)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-purple-300 hover:text-white bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 transition-all cursor-pointer"
                        >
                          Explore <span aria-hidden="true">↗</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default DomainList;
