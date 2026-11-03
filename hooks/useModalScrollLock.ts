import { useLayoutEffect } from 'react';
import { acquireModalScrollLock, type ModalScrollLockMode } from '../utils/modalScrollLock';

/** Locks the page without changing its layout. Safe for overlapping overlays. */
export const useModalScrollLock = (
  open: boolean,
  mode: ModalScrollLockMode = 'overflow',
): void => {
  useLayoutEffect(() => {
    if (!open) return;
    return acquireModalScrollLock(mode);
  }, [open, mode]);
};
