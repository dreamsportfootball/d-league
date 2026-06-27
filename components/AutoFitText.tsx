import React, { useLayoutEffect, useRef, useState } from 'react';

interface AutoFitTextProps {
  text: string;
  className?: string;
  maxFontSize?: number;
  minFontSize?: number;
  fitPadding?: number;
  lineHeight?: React.CSSProperties['lineHeight'];
  title?: string;
}

const AutoFitText: React.FC<AutoFitTextProps> = ({
  text,
  className = '',
  maxFontSize,
  minFontSize = 6,
  fitPadding = 0,
  lineHeight = 1.15,
  title,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(maxFontSize ?? null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const fit = () => {
      const availableWidth = Math.max(0, element.clientWidth - fitPadding);
      if (availableWidth <= 0) return;

      element.style.fontSize = maxFontSize ? `${maxFontSize}px` : '';
      const computedFontSize = Number.parseFloat(window.getComputedStyle(element).fontSize) || 16;
      const naturalFontSize = maxFontSize ?? computedFontSize;
      const requiredWidth = element.scrollWidth;
      let nextSize = requiredWidth > availableWidth
        ? Math.max(minFontSize, (naturalFontSize * availableWidth) / requiredWidth)
        : naturalFontSize;

      element.style.fontSize = `${nextSize}px`;
      while (nextSize > minFontSize && element.scrollWidth > availableWidth) {
        nextSize = Math.max(minFontSize, nextSize - 0.5);
        element.style.fontSize = `${nextSize}px`;
      }

      const roundedSize = Math.round(nextSize * 2) / 2;
      element.style.fontSize = `${roundedSize}px`;
      setFontSize((currentSize) => currentSize === roundedSize ? currentSize : roundedSize);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    document.fonts?.ready.then(fit).catch(() => undefined);

    return () => observer.disconnect();
  }, [fitPadding, maxFontSize, minFontSize, text]);

  return (
    <span
      ref={ref}
      title={title ?? text}
      className={`block w-full whitespace-nowrap ${className}`}
      style={{
        ...(fontSize === null ? {} : { fontSize: `${fontSize}px` }),
        lineHeight,
      }}
    >
      {text}
    </span>
  );
};

export default AutoFitText;
