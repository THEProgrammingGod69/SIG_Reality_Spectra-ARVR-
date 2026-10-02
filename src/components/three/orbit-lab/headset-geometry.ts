import { BufferGeometry, Float32BufferAttribute, QuadraticBezierCurve3, Vector3 } from 'three';

/**
 * The wireframe VR headset, built procedurally (no .glb to download).
 *
 * Everything is line segments: front and back visor outlines joined by
 * struts, a face plate, two lens rims, two sensors and the head straps. Each
 * vertex carries a `aProgress` value that runs left to right across the
 * headset, so the shader can "draw" the outline in by raising one uniform.
 */

/** Overall half-width of the visor, used to normalise the draw-in sweep. */
export const HEADSET_HALF_WIDTH = 1.2;

type Polyline = Vector3[];

function roundedRect(width: number, height: number, radius: number, z: number, steps = 10) {
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.min(radius, halfW, halfH);
  const corners = [
    { cx: halfW - r, cy: halfH - r, start: 0 },
    { cx: -halfW + r, cy: halfH - r, start: Math.PI / 2 },
    { cx: -halfW + r, cy: -halfH + r, start: Math.PI },
    { cx: halfW - r, cy: -halfH + r, start: (3 * Math.PI) / 2 },
  ];

  const points: Polyline = [];
  for (const corner of corners) {
    for (let i = 0; i <= steps; i += 1) {
      const angle = corner.start + (i / steps) * (Math.PI / 2);
      points.push(new Vector3(corner.cx + Math.cos(angle) * r, corner.cy + Math.sin(angle) * r, z));
    }
  }
  points.push(points[0]!.clone());
  return points;
}

function circle(cx: number, cy: number, radius: number, z: number, steps = 40): Polyline {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2;
    return new Vector3(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, z);
  });
}

function curve(from: Vector3, control: Vector3, to: Vector3, steps = 24): Polyline {
  return new QuadraticBezierCurve3(from, control, to).getPoints(steps);
}

/** Pick evenly spaced points around a closed polyline (for the visor struts). */
function samplesAround(line: Polyline, count: number): Vector3[] {
  const step = (line.length - 1) / count;
  return Array.from({ length: count }, (_, i) => line[Math.round(i * step)]!);
}

function buildPolylines(): Polyline[] {
  const front = roundedRect(2.4, 1.2, 0.42, 0.42);
  const back = roundedRect(2.2, 1.04, 0.36, -0.3);
  const plate = roundedRect(1.86, 0.74, 0.26, 0.44);

  const backAnchors = samplesAround(back, 8);
  const struts = samplesAround(front, 8).map((point, i) => [point, backAnchors[i]!]);

  const strapBack = new Vector3(0, 0.02, -1.85);
  const sideStraps = [
    curve(new Vector3(-1.08, 0, -0.3), new Vector3(-1.5, 0, -1.6), strapBack),
    curve(new Vector3(1.08, 0, -0.3), new Vector3(1.5, 0, -1.6), strapBack),
  ];
  const topStrap = curve(new Vector3(0, 0.52, -0.3), new Vector3(0, 0.82, -1.25), strapBack);

  return [
    front,
    back,
    plate,
    ...struts,
    // Lens rims sit on the inside face, visible through the wireframe.
    circle(-0.5, -0.02, 0.27, -0.31),
    circle(0.5, -0.02, 0.27, -0.31),
    // Sensors on the face plate.
    circle(-0.7, 0.22, 0.05, 0.45, 12),
    circle(0.7, 0.22, 0.05, 0.45, 12),
    ...sideStraps,
    topStrap,
  ];
}

export type HeadsetLines = {
  geometry: BufferGeometry;
  /** Segment endpoints, for sampling particle targets along the outline. */
  segments: Float32Array;
};

/** Build the headset as a `LineSegments` geometry with an `aProgress` attribute. */
export function createHeadsetLines(): HeadsetLines {
  const positions: number[] = [];
  const progress: number[] = [];

  const progressOf = (point: Vector3) =>
    // Left-to-right sweep, with straps (further back) drawn slightly later.
    Math.min(1, Math.max(0, (point.x / HEADSET_HALF_WIDTH + 1) / 2 - point.z * 0.06));

  for (const line of buildPolylines()) {
    for (let i = 0; i < line.length - 1; i += 1) {
      const a = line[i]!;
      const b = line[i + 1]!;
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      progress.push(progressOf(a), progressOf(b));
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aProgress', new Float32BufferAttribute(progress, 1));
  geometry.computeBoundingSphere();

  return { geometry, segments: new Float32Array(positions) };
}

/**
 * `count` points on the outline, chosen by segment length so long edges get
 * proportionally more — the particles converge onto these.
 */
export function samplePointsOnSegments(
  segments: Float32Array,
  count: number,
  random: () => number,
) {
  const segmentCount = segments.length / 6;
  const cumulative = new Float32Array(segmentCount);
  let total = 0;
  for (let s = 0; s < segmentCount; s += 1) {
    const o = s * 6;
    total += Math.hypot(
      segments[o + 3]! - segments[o]!,
      segments[o + 4]! - segments[o + 1]!,
      segments[o + 5]! - segments[o + 2]!,
    );
    cumulative[s] = total;
  }

  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const target = random() * total;
    let lo = 0;
    let hi = segmentCount - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid]! < target) lo = mid + 1;
      else hi = mid;
    }
    const o = lo * 6;
    const t = random();
    out[i * 3] = segments[o]! + (segments[o + 3]! - segments[o]!) * t;
    out[i * 3 + 1] = segments[o + 1]! + (segments[o + 4]! - segments[o + 1]!) * t;
    out[i * 3 + 2] = segments[o + 2]! + (segments[o + 5]! - segments[o + 2]!) * t;
  }
  return out;
}
