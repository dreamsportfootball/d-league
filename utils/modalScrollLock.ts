// Single owner for scroll locks used by overlays, drawers, and native dialogs.
// Each caller releases its own lock; background styles are restored only when
// the last overlay closes, regardless of the order in which overlays unmount.
export type ModalScrollLockMode = 'overflow' | 'fixed';

interface ScrollStyleSnapshot {
  bodyOverflow: string;
  bodyPosition: string;
  bodyTop: string;
  bodyWidth: string;
  htmlOverflow: string;
  scrollbarGutter: string;
  scrollY: number;
}

let activeLocks = 0;
let snapshot: ScrollStyleSnapshot | null = null;
let fixedLocks = 0;
let hadFixedBody = false;

const applyFixedBody = (scrollY: number): void => {
  const body = document.body;
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.width = '100%';
};

const restoreOriginalPosition = (original: ScrollStyleSnapshot): void => {
  const body = document.body;
  body.style.position = original.bodyPosition;
  body.style.top = original.bodyTop;
  body.style.width = original.bodyWidth;
  window.scrollTo({ top: original.scrollY, behavior: 'instant' });
};

export const acquireModalScrollLock = (
  mode: ModalScrollLockMode = 'overflow',
): (() => void) => {
  const body = document.body;
  const html = document.documentElement;

  if (activeLocks === 0) {
    hadFixedBody = false;
    snapshot = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverflow: html.style.overflow,
      scrollbarGutter: html.style.scrollbarGutter,
      scrollY: window.scrollY,
    };

    // Classic scrollbars occupy layout width. Keep their gutter while hidden,
    // but do not invent a gutter on devices with overlay scrollbars.
    if (window.innerWidth > html.clientWidth) {
      html.style.scrollbarGutter = 'stable';
    }
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
  }

  activeLocks += 1;
  if (mode === 'fixed') {
    hadFixedBody = true;
    fixedLocks += 1;
    if (fixedLocks === 1 && snapshot) {
      applyFixedBody(snapshot.scrollY);
    }
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;

    activeLocks -= 1;
    if (mode === 'fixed') {
      fixedLocks -= 1;
      if (fixedLocks === 0 && snapshot && activeLocks > 0) {
        restoreOriginalPosition(snapshot);
      }
    }

    if (activeLocks > 0 || !snapshot) return;
    const original = snapshot;
    snapshot = null;
    body.style.overflow = original.bodyOverflow;
    html.style.overflow = original.htmlOverflow;
    html.style.scrollbarGutter = original.scrollbarGutter;
    body.style.position = original.bodyPosition;
    body.style.top = original.bodyTop;
    body.style.width = original.bodyWidth;
    if (hadFixedBody) {
      window.scrollTo({ top: original.scrollY, behavior: 'instant' });
    }
    fixedLocks = 0;
    hadFixedBody = false;
  };
};
