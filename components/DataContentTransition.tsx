import React, { useLayoutEffect, useRef } from 'react';

interface DataContentTransitionProps {
  contentKey: string;
  className?: string;
  children: React.ReactNode;
}

/** Animates only when the selected data context changes, not on first render. */
const DataContentTransition: React.FC<DataContentTransitionProps> = ({ contentKey, className = '', children }) => {
  const previousKeyRef = useRef(contentKey);
  const changed = previousKeyRef.current !== contentKey;

  useLayoutEffect(() => {
    previousKeyRef.current = contentKey;
  }, [contentKey]);

  return (
    <div key={contentKey} className={`${className} ${changed ? 'dleague-data-content-transition' : ''}`.trim()}>
      {children}
    </div>
  );
};

export default DataContentTransition;
