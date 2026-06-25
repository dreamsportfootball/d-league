import React, { useEffect } from 'react';

const optimizeImageElement = (image: HTMLImageElement) => {
  if (image.dataset.imageOptimized === 'true') return;

  const explicitlyPrioritized = image.dataset.imagePriority === 'true';
  const rect = image.getBoundingClientRect();
  const appearsNearViewport = rect.bottom > 0 && rect.top < window.innerHeight * 1.25;

  if (explicitlyPrioritized) {
    image.loading = 'eager';
    image.setAttribute('fetchpriority', 'high');
  } else if (appearsNearViewport) {
    if (!image.hasAttribute('loading')) image.loading = 'eager';
    if (!image.hasAttribute('fetchpriority')) image.setAttribute('fetchpriority', 'auto');
  } else {
    image.loading = 'lazy';
    image.setAttribute('fetchpriority', 'low');
  }

  image.decoding = 'async';
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
