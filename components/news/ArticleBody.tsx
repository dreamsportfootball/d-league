import React, { Fragment, useMemo } from 'react';

interface ArticleBodyProps {
  text: string;
}

type ArticleBlock =
  | { type: 'heading2'; text: string }
  | { type: 'heading3'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'divider' }
  | { type: 'label'; text: string }
  | { type: 'info'; lines: string[] }
  | { type: 'paragraph'; text: string };

const DIVIDER_PATTERN = /^[-—–]{1,4}$/;
const BULLET_PATTERN = /^(?:[-*•▪▸・●○])\s*(.+)$/;
const ORDERED_PATTERN = /^\d+[.、]\s*(.+)$/;
const INFO_LINE_PATTERN = /^(?:\d{1,2}:\d{2}\s|📅|📍|📢|⏰|⚠️|🏆|🥇|🥈|🥉|D LEAGUE｜|League\s+[123]\b)/i;
const LABEL_PATTERN = /^【[^】]+】$/;
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

const stripListMarker = (line: string): string =>
  line.match(BULLET_PATTERN)?.[1] ?? line.match(ORDERED_PATTERN)?.[1] ?? line;

const parseBlock = (rawBlock: string): ArticleBlock => {
  const block = rawBlock.trim();
  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);

  if (DIVIDER_PATTERN.test(block)) return { type: 'divider' };
  if (block.startsWith('### ')) return { type: 'heading3', text: block.slice(4).trim() };
  if (block.startsWith('## ')) return { type: 'heading2', text: block.slice(3).trim() };
  if (block.startsWith('> ')) return { type: 'quote', text: block.slice(2).trim() };
  if (lines.length === 1 && LABEL_PATTERN.test(lines[0])) return { type: 'label', text: lines[0] };

  const bulletLines = lines.filter((line) => BULLET_PATTERN.test(line));
  const orderedLines = lines.filter((line) => ORDERED_PATTERN.test(line));
  if (lines.length > 0 && bulletLines.length === lines.length) {
    return { type: 'list', ordered: false, items: lines.map(stripListMarker) };
  }
  if (lines.length > 0 && orderedLines.length === lines.length) {
    return { type: 'list', ordered: true, items: lines.map(stripListMarker) };
  }

  const infoLineCount = lines.filter((line) => INFO_LINE_PATTERN.test(line)).length;
  if (lines.length >= 2 && infoLineCount >= Math.min(2, Math.ceil(lines.length / 2))) {
    return { type: 'info', lines };
  }

  return { type: 'paragraph', text: block };
};

const renderInlineText = (text: string): React.ReactNode =>
  text.split(URL_PATTERN).map((part, index) => {
    if (!URL_PATTERN.test(part)) return <Fragment key={`${index}-${part.slice(0, 12)}`}>{part}</Fragment>;
    URL_PATTERN.lastIndex = 0;
    return (
      <a
        key={`${index}-${part}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-semibold text-brand-blue underline decoration-brand-blue/30 underline-offset-4 transition-colors hover:decoration-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        {part}
      </a>
    );
  });

const renderMultilineText = (text: string): React.ReactNode[] =>
  text.split('\n').map((line, index, lines) => (
    <Fragment key={`${index}-${line.slice(0, 16)}`}>
      {renderInlineText(line)}
      {index < lines.length - 1 && <br />}
    </Fragment>
  ));

const ArticleBody: React.FC<ArticleBodyProps> = ({ text }) => {
  const blocks = useMemo(
    () =>
      text
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map(parseBlock),
    [text],
  );

  if (blocks.length === 0) {
    return (
      <div className="border-y border-neutral-200 py-8 text-sm leading-7 text-neutral-500">
        本篇公告目前沒有其他內文
      </div>
    );
  }

  return (
    <div className="break-words text-[16px] font-normal leading-[1.95] text-neutral-800 md:text-[17px] md:leading-[2]">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === 'divider') {
          return <hr key={key} className="my-10 border-0 border-t border-neutral-200" />;
        }

        if (block.type === 'heading2') {
          return (
            <h2 key={key} className="mb-5 mt-12 font-display text-2xl font-black leading-tight tracking-tight text-brand-black md:text-3xl">
              {renderInlineText(block.text)}
            </h2>
          );
        }

        if (block.type === 'heading3') {
          return (
            <h3 key={key} className="mb-4 mt-9 font-display text-xl font-bold leading-snug tracking-tight text-brand-black md:text-2xl">
              {renderInlineText(block.text)}
            </h3>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote key={key} className="my-9 border-l-4 border-brand-blue bg-neutral-50 px-5 py-4 font-medium leading-8 text-neutral-700 md:px-6">
              {renderMultilineText(block.text)}
            </blockquote>
          );
        }

        if (block.type === 'label') {
          return (
            <p key={key} className="mb-4 mt-9 font-display text-sm font-black tracking-[0.16em] text-brand-blue">
              {block.text}
            </p>
          );
        }

        if (block.type === 'info') {
          return (
            <div key={key} className="my-8 border-y border-neutral-200 bg-neutral-50 px-5 py-5 md:px-6">
              <div className="space-y-2 font-medium leading-7 text-neutral-800">
                {block.lines.map((line, lineIndex) => (
                  <p key={`${lineIndex}-${line.slice(0, 16)}`}>{renderInlineText(line)}</p>
                ))}
              </div>
            </div>
          );
        }

        if (block.type === 'list') {
          const ListElement = block.ordered ? 'ol' : 'ul';
          return (
            <ListElement
              key={key}
              className={`my-7 space-y-3 pl-6 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:font-bold marker:text-brand-blue`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item.slice(0, 16)}`} className="pl-1">
                  {renderInlineText(item)}
                </li>
              ))}
            </ListElement>
          );
        }

        return (
          <p key={key} className="mb-7 whitespace-normal">
            {renderMultilineText(block.text)}
          </p>
        );
      })}
    </div>
  );
};

export default ArticleBody;
