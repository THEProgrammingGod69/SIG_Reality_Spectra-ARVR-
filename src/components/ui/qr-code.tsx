import 'server-only';

import QRCode from 'qrcode';

import { cn } from '@/lib/cn';

/** Blank modules around the code; the QR spec asks for four. */
const QUIET_ZONE = 4;

/**
 * The SVG path of a QR code for `value`: one unit square per dark module,
 * offset by the quiet zone. Exported for tests.
 */
export function qrPath(value: string): { path: string; size: number } {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
  let path = '';
  for (let row = 0; row < modules.size; row += 1) {
    for (let col = 0; col < modules.size; col += 1) {
      if (modules.get(row, col)) path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
    }
  }
  return { path, size: modules.size + QUIET_ZONE * 2 };
}

type QrCodeProps = {
  /** The URL the code opens — the same link the button beside it uses. */
  value: string;
  /** Accessible name, e.g. "QR code for the club's Instagram". */
  label: string;
  className?: string;
};

/**
 * A scannable QR code generated from the link itself (D-023), so the code can
 * never drift from the link shown beside it. Rendered on the server as one SVG
 * path in token colours — dark modules on the light text colour, the pairing
 * phone cameras read most reliably — and sharp at any size.
 */
export function QrCode({ value, label, className }: QrCodeProps) {
  const { path, size } = qrPath(value);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={cn('aspect-square rounded-control bg-(--color-text) text-(--color-bg)', className)}
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
