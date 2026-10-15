/**
 * A whisper of film grain over the public site (D-037): the "cinematic" in
 * the brief, and it keeps large dark gradients from banding on cheap screens.
 *
 * One static noise tile (`bg-grain`) repeated over a fixed layer, at
 * `--grain-strength` opacity; nothing animates and nothing blends, so it costs
 * one composited quad per frame. Above the page, under the header, never
 * clickable. From `md` up: on phones the grain is below what the eye resolves.
 */
export function FilmGrain() {
  return (
    <div
      aria-hidden="true"
      data-film-grain
      className="pointer-events-none fixed inset-0 z-(--z-grain) hidden bg-grain opacity-(--grain-strength) md:block"
    />
  );
}
