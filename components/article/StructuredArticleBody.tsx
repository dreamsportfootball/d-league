import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SHOW_REGISTRATION_NAV } from '../../config/siteConfig';
import type { StructuredArticleContentBlock } from '../../types/articleContent';

interface StructuredArticleBodyProps {
  blocks: StructuredArticleContentBlock[];
}

const StructuredArticleBody: React.FC<StructuredArticleBodyProps> = ({ blocks }) => (
  <div className="break-words text-left text-[16px] font-normal leading-[1.9] text-neutral-800 md:text-[17px] md:leading-[1.95]">
    {blocks.map((block, index) => {
      const key = `${block.type}-${index}`;

      if (block.type === 'matchInfo') {
        return (
          <section key={key} className="mb-10 border-y border-neutral-200 py-6 md:py-8" aria-label="賽事資訊">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-xs font-bold tracking-[0.16em] text-brand-blue">
                {block.competition}｜{block.round}
              </p>
              {block.dateLabel && (
                <p className="font-mono text-[11px] tracking-[0.08em] text-neutral-400">
                  {block.dateLabel}
                </p>
              )}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 md:gap-6">
              <p className="text-right font-display text-lg font-bold leading-snug text-brand-black md:text-2xl">
                {block.homeTeam}
              </p>
              <p className="font-display text-3xl font-bold tracking-tight text-brand-black md:text-5xl">
                {block.homeScore}
                <span className="mx-2 text-neutral-300">–</span>
                {block.awayScore}
              </p>
              <p className="font-display text-lg font-bold leading-snug text-brand-black md:text-2xl">
                {block.awayTeam}
              </p>
            </div>
          </section>
        );
      }

      if (block.type === 'keyFacts') {
        return (
          <dl key={key} className="mb-10 divide-y divide-neutral-200 border-y border-neutral-200">
            {block.items.map((item) => (
              <div key={`${item.label}-${item.value}`} className="grid gap-1 py-4 md:grid-cols-[150px_minmax(0,1fr)] md:gap-6 md:py-5">
                <dt className="text-xs font-bold tracking-[0.12em] text-brand-blue">{item.label}</dt>
                <dd className="font-display text-lg font-semibold leading-snug text-brand-black md:text-xl">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        );
      }

      if (block.type === 'heading') {
        return (
          <h2 key={key} className="mb-5 mt-11 font-display text-2xl font-bold leading-snug tracking-tight text-brand-black first:mt-0 md:text-[28px]">
            {block.text}
          </h2>
        );
      }

      if (block.type === 'paragraph') {
        return (
          <p
            key={key}
            className={
              block.variant === 'lead'
                ? 'mb-8 text-[18px] font-medium leading-[1.85] text-neutral-700 md:text-xl md:leading-[1.8]'
                : 'mb-7 last:mb-0'
            }
          >
            {block.text}
          </p>
        );
      }

      if (block.type === 'timeline') {
        return (
          <ol key={key} className="mb-9 divide-y divide-neutral-200 border-y border-neutral-200">
            {block.items.map((item) => (
              <li key={`${item.time}-${item.text}`} className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 py-4 md:grid-cols-[64px_minmax(0,1fr)] md:gap-5 md:py-5">
                <span className="font-mono text-sm font-bold text-brand-blue">{item.time}</span>
                <span className="leading-[1.85] text-neutral-800">{item.text}</span>
              </li>
            ))}
          </ol>
        );
      }

      if (block.type === 'list') {
        const ListElement = block.ordered ? 'ol' : 'ul';
        return (
          <ListElement
            key={key}
            className={`mb-8 space-y-2.5 pl-6 ${
              block.ordered ? 'list-decimal' : 'list-disc'
            } marker:font-bold marker:text-brand-blue`}
          >
            {block.items.map((item) => (
              <li key={item} className="pl-1">
                {item}
              </li>
            ))}
          </ListElement>
        );
      }

      if (block.type === 'notice') {
        return (
          <aside key={key} className="my-10 border-l-4 border-brand-blue bg-neutral-50 px-5 py-5 md:px-6 md:py-6">
            {block.title && (
              <h3 className="mb-2 font-display text-lg font-bold text-brand-black">{block.title}</h3>
            )}
            <p className="leading-[1.85] text-neutral-700">{block.text}</p>
          </aside>
        );
      }

      if (block.type === 'cta') {
        if (block.href === '/registration' && !SHOW_REGISTRATION_NAV) return null;

        const className =
          'group inline-flex min-h-12 items-center justify-center rounded-sm bg-brand-blue px-6 py-3 text-sm font-bold tracking-[0.08em] text-white transition-colors hover:bg-brand-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2';
        const content = (
          <>
            {block.label}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </>
        );

        return (
          <div key={key} className="mt-12 border-t border-neutral-200 pt-8">
            {block.href.startsWith('/') ? (
              <Link to={block.href} className={className}>
                {content}
              </Link>
            ) : (
              <a href={block.href} target="_blank" rel="noopener noreferrer" className={className}>
                {content}
              </a>
            )}
          </div>
        );
      }

      return null;
    })}
  </div>
);

export default StructuredArticleBody;
