// A shared observer keeps long match lists inexpensive even when many scores are present.
type RevealCallback = () => void;

const callbacks = new WeakMap<Element, RevealCallback>();
let observer: IntersectionObserver | null = null;

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const onVisibleOnce = (element: Element, callback: RevealCallback): (() => void) => {
  if (typeof IntersectionObserver === 'undefined') {
    callback();
    return () => undefined;
  }

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const animate = callbacks.get(entry.target);
          callbacks.delete(entry.target);
          observer?.unobserve(entry.target);
          animate?.();
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -12px 0px' },
    );
  }

  callbacks.set(element, callback);
  observer.observe(element);
  return () => {
    callbacks.delete(element);
    observer?.unobserve(element);
  };
};
