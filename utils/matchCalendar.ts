import type { Match } from '../types';

const escapeCalendarValue = (value: string): string => value
  .replace(/\\/g, '\\\\')
  .replace(/\r?\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

const toUtcStamp = (value: string | number): string => new Date(value)
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\.\d{3}/, '');

const foldLine = (line: string): string => {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let current = '';
  let length = 0;
  for (const character of line) {
    const nextLength = encoder.encode(character).length;
    if (length + nextLength > 75) {
      chunks.push(current);
      current = ' ';
      length = 1;
    }
    current += character;
    length += nextLength;
  }
  if (current) chunks.push(current);
  return chunks.join('\r\n');
};

/** Only the published kickoff is known. Do not invent a final whistle time. */
export const buildMatchCalendarEvent = (match: Match, homeName: string, awayName: string, url: string): string => {
  const kickoff = Date.parse(match.timestamp);
  if (!Number.isFinite(kickoff)) throw new Error('無效的比賽時間');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//D LEAGUE//Match Fixtures//ZH-TW',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + match.id + '@d-league.dreamsportfootball.github.io',
    'DTSTAMP:' + toUtcStamp(Date.now()),
    'DTSTART:' + toUtcStamp(kickoff),
    'SUMMARY:' + escapeCalendarValue(homeName + ' vs ' + awayName + '｜D LEAGUE ' + match.league),
    'LOCATION:' + escapeCalendarValue(match.venue ?? '台南市立仁德文賢國中人工草'),
    'DESCRIPTION:' + escapeCalendarValue('第 ' + match.round + ' 輪。此行程只標示已公布開賽時間，詳情及異動請以官方賽程為準。' + '\n' + url),
    'URL:' + url,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
};

export const downloadMatchCalendarEvent = (match: Match, homeName: string, awayName: string, url: string): void => {
  const content = buildMatchCalendarEvent(match, homeName, awayName, url);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = 'D-LEAGUE-' + match.id + '.ics';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
};
