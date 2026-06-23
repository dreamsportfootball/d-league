import React from 'react';
import SeasonSelector from './SeasonSelector';

interface SeasonPageHeaderProps {
  title: string;
  accent: string;
  description: React.ReactNode;
  bordered?: boolean;
}

const SeasonPageHeader: React.FC<SeasonPageHeaderProps> = ({
  title,
  accent,
  description,
  bordered = false,
}) => (
  <section
    className={`mb-8 md:mb-12 ${
      bordered ? 'border-b border-neutral-100 pb-8 md:pb-10' : ''
    }`}
  >
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h1 className="mb-2 font-display text-4xl font-black uppercase tracking-tight text-brand-black [-webkit-text-stroke:.25px_currentColor] md:mb-4 md:text-6xl md:font-extrabold md:[-webkit-text-stroke:0px]">
          {title} <span className="text-brand-blue">{accent}</span>
        </h1>
        <div className="text-sm font-medium tracking-wide text-neutral-400 md:text-base">
          {description}
        </div>
      </div>

      <div className="flex w-full justify-end md:w-auto">
        <SeasonSelector />
      </div>
    </div>
  </section>
);

export default SeasonPageHeader;
