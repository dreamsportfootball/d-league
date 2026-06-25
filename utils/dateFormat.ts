const TAIPEI_TIME_ZONE = 'Asia/Taipei';

const taipeiDateFormatter = new Intl.DateTimeFormat('zh-TW', {
  timeZone: TAIPEI_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const getDateParts = (isoString: string): { year: string; month: string; day: string } | null => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;

  const parts = taipeiDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return year && month && day ? { year, month, day } : null;
};

export const formatTaipeiDate = (isoString: string, separator = '/'): string => {
  const parts = getDateParts(isoString);
  return parts ? `${parts.year}${separator}${parts.month}${separator}${parts.day}` : '';
};
