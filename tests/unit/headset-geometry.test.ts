import { describe, expect, it } from 'vitest';

import {
  createHeadsetLines,
  samplePointsOnSegments,
} from '@/components/three/orbit-lab/headset-geometry';
import { seededRandom } from '@/lib/motion/random';

describe('createHeadsetLines', () => {
  const { geometry, segments } = createHeadsetLines();

  it('builds whole line segments with a draw-in progress per vertex', () => {
    const positions = geometry.getAttribute('position');
    const progress = geometry.getAttribute('aProgress');

    expect(positions.count % 2).toBe(0);
    expect(progress.count).toBe(positions.count);
    expect(segments.length).toBe(positions.count * 3);
  });

  it('keeps every progress value in [0, 1], so uDraw = 1 shows the whole outline', () => {
    const progress = geometry.getAttribute('aProgress');
    for (let i = 0; i < progress.count; i += 1) {
      expect(progress.getX(i)).toBeGreaterThanOrEqual(0);
      expect(progress.getX(i)).toBeLessThanOrEqual(1);
    }
  });

  it('samples particle targets that lie within the headset bounds', () => {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const points = samplePointsOnSegments(segments, 200, seededRandom(1));

    expect(points.length).toBe(600);
    for (let i = 0; i < points.length; i += 3) {
      expect(points[i]!).toBeGreaterThanOrEqual(box.min.x - 1e-6);
      expect(points[i]!).toBeLessThanOrEqual(box.max.x + 1e-6);
      expect(points[i + 1]!).toBeGreaterThanOrEqual(box.min.y - 1e-6);
      expect(points[i + 1]!).toBeLessThanOrEqual(box.max.y + 1e-6);
    }
  });
});
