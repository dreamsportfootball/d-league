import { useEffect } from 'react';

const optimizeImageElement = (image: HTMLImageElement) => {
  if (image.dataset.imageOptimized === 'true') return;

  const explicitlyPrioritized = image.dataset.imagePriority === 'true';
  const rect = image.getBoundingClientRect();
  const appearsNearViewport = rect.bottom > 0 && rect.top < window.innerHeight * 1.25;

  if (explicitlyPrioritized || appearsNearViewport) {
    if (!image.hasAttribute('loading')) image.loading = 'eager';
    if (!image.hasAttribute('fetchpriority')) {
      image.setAttribute('fetchpriority', explicitlyPrioritized ? 'high' : 'auto');
    }
  } else {
    if (!image.hasAttribute('loading')) image.loading = 'lazy';
    if (!image.hasAttribute('fetchpriority')) image.setAttribute('fetchpriority', 'low');
  }

  if (!image.hasAttribute('decoding')) image.decoding = 'async';
  image.dataset.imageOptimized = 'true';
};

const optimizeImagesWithin = (root: ParentNode) => {
  if (root instanceof HTMLImageElement) optimizeImageElement(root);
  root.querySelectorAll<HTMLImageElement>('img').forEach(optimizeImageElement);
};

const ImageLoadingOptimizer: React.FC = () => {
  useEffect(() => {
    optimizeImagesWithin(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) optimizeImagesWithin(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
};

export default ImageLoadingOptimizer;
