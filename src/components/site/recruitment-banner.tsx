/**
 * Site-wide "Recruitment is open" banner — the slot, reserved in Stage 3.
 *
 * Stage 8 fills it: it reads the cached recruitment settings (`recruitment`
 * tag), renders only while recruitment is open, and is dismissible per
 * session. Until then it renders nothing, so the layout already has its
 * place and no page changes when it arrives.
 */
export function RecruitmentBanner() {
  return null;
}
