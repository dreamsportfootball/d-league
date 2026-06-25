export const TAIPEI_TIME_ZONE = 'Asia/Taipei';

interface TaipeiDateParts {
  year: string;
  month: string;
  day: string;
  weekday: string;
  hour: string;
  minute: string;
}

const taipeiPartsFormatter = new Intl.DateTimeFormat('zh-TW', {
  timeZone: TAIPEI_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const getPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string =>
  parts.find((part) => part.type === type)?.value ?? '';

export const getTaipeiDateParts = (value: string | Date): TaipeiDateParts | null => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = taipeiPartsFormatter.formatToParts(date);
  const year = getPart(parts, 'year');
  const month = getPart(parts, 'month');
  const day = getPart(parts, 'day');
  const weekday = getPart(parts, 'weekday').replace(/^週/, '');
  const hour = getPart(parts, 'hour');
  const minute = getPart(parts, 'minute');

  return year && month && day && hour && minute
    ? { year, month, day, weekday, hour, minute }
    : null;
};

export const formatTaipeiDate = (value: string | Date, separator = '/'): string => {
  const parts = getTaipeiDateParts(value);
  return parts ? `${parts.year}${separator}${parts.month}${separator}${parts.day}` : '';
};

export const formatTaipeiDateKey = (value: string | Date): string =>
  formatTaipeiDate(value, '-');

export const formatTaipeiTime = (value: string | Date): string => {
  const parts = getTaipeiDateParts(value);
  return parts ? `${parts.hour}:${parts.minute}` : '';
};

export const formatTaipeiMonthDayWeekday = (value: string | Date): string => {
  const parts = getTaipeiDateParts(value);
  return parts ? `${Number(parts.month)}/${Number(parts.day)} 週${parts.weekday}` : '';
};

export const formatTaipeiDateWithWeekday = (value: string | Date): string => {
  const parts = getTaipeiDateParts(value);
  return parts ? `${parts.year}.${parts.month}.${parts.day}（${parts.weekday}）` : '';
};
