/**
 * `sizes` for an image cropped to fill its frame (`object-cover`).
 *
 * A browser picks a srcset file by width alone. A photo wider than its frame
 * must fill the frame's height too, so the file chosen for the frame's width
 * comes back too short and is stretched: on a DPR-3 phone a 16:9 photo in a
 * square gallery tile was 1.6× soft. Widening every length in `sizes` by how
 * much wider the photo is than the frame asks for the file that fills both.
 *
 * Capped, so a panorama never fetches a file several screens wide; next/image
 * never enlarges a file either, so a small upload is simply served whole.
 */
export function coverSizes(
  sizes: string,
  { width, height }: { width: number; height: number },
  /** The frame's width over its height: 1 for a square tile, 4 / 5 for a portrait card. */
  frameRatio = 1,
): string {
  const widening = Math.min(MAX_WIDENING, width / height / frameRatio);
  // A photo as narrow as its frame or narrower is width-bound: `sizes` is right.
  if (!(widening > 1)) return sizes;
  return sizes
    .split(',')
    .map((entry) =>
      entry.replace(
        LENGTH_AT_END,
        (_, value: string, unit: string) => `${Math.ceil(Number(value) * widening)}${unit}`,
      ),
    )
    .join(',');
}

/** The source size at the end of one `sizes` entry: `18rem`, `50vw`, `320px`. */
const LENGTH_AT_END = /(\d*\.?\d+)(vw|rem|px)\s*$/;

/** A 5:2 panorama in a square tile; anything wider is cropped from this file. */
const MAX_WIDENING = 2.5;
