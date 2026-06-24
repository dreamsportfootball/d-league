import React, { useLayoutEffect, useRef, useState } from 'react';

interface AutoFitTextProps {
  text: string;
  className?: string;
  maxFontSize?: number;
  minFontSize?: number;
  title?: string;
}

const AutoFitText: React.FC<AutoFitTextProps> = ({
  text,
  className = '',
  maxFontSize = 16,
  minFontSize = 7,
  title,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const fit = () => {
      const availableWidth = element.clientWidth;
      if (availableWidth <= 0) return;

      element.style.fontSize = `${maxFontSize}px`;
      const requiredWidth = element.scrollWidth;
      const nextSize =
        requiredWidth > availableWidth
          ? Math.max(minFontSize, Math.floor((maxFontSize * availableWidth) / requiredWidth))
          : maxFontSize;
      setFontSize(nextSize);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    document.fonts?.ready.then(fit).catch(() => undefined);

    return () => observer.disconnect();
  }, [maxFontSize, minFontSize, text]);

  return (
    <span
      ref={ref}
      title={title ?? text}
      className={`block w-full whitespace-nowrap ${className}`}
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.15 }}
    >
      {text}
    </span>
  );
};

export default AutoFitText;
