import { describe, expect, it } from 'vitest';

import { coverSizes } from '@/lib/image-sizes';

describe('coverSizes', () => {
  const tile = '(min-width: 64rem) 18rem, 50vw';

  it('leaves a photo no wider than its frame alone', () => {
    expect(coverSizes(tile, { width: 1080, height: 1350 })).toBe(tile);
    expect(coverSizes(tile, { width: 1200, height: 1200 })).toBe(tile);
  });

  it('widens every length by how much wider the photo is than the frame', () => {
    // 16:9 in a square: the file must be 1.78× the tile's width to fill its height.
    expect(coverSizes(tile, { width: 1920, height: 1080 })).toBe('(min-width: 64rem) 32rem, 89vw');
    // 4:3 in a 4:5 card: 1.67×.
    expect(coverSizes('(min-width: 48rem) 15rem, 72vw', { width: 1600, height: 1200 }, 4 / 5)).toBe(
      '(min-width: 48rem) 25rem, 120vw',
    );
  });

  it('caps a panorama, and keeps media conditions and px lengths intact', () => {
    expect(coverSizes('(min-width: 40rem) 320px, 100vw', { width: 6000, height: 1000 })).toBe(
      '(min-width: 40rem) 800px, 250vw',
    );
  });

  it('ignores an image without usable dimensions', () => {
    expect(coverSizes(tile, { width: 0, height: 0 })).toBe(tile);
  });
});
