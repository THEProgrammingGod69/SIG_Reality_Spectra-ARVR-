/**
 * The dimmed backdrop behind the admin's dialogs and sheet: one definition, so
 * every overlay looks and fades the same (transform/opacity only, D-033).
 */
export const overlayClassName =
  'fixed inset-0 z-(--z-overlay) bg-(--color-void)/60 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in';
