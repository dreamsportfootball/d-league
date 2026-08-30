import type { PlayerProfile } from '../types/player';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

const parseDateOnly = (value: string): DateParts => {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid date-only value: ${value}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return { year, month, day };
};

export const calculateAgeOnDate = (birthDate: string, referenceDate: string): number => {
  const birth = parseDateOnly(birthDate);
  const reference = parseDateOnly(referenceDate);

  const birthKey = birth.year * 10000 + birth.month * 100 + birth.day;
  const referenceKey = reference.year * 10000 + reference.month * 100 + reference.day;
  if (birthKey > referenceKey) {
    throw new Error(`Birth date ${birthDate} is after age reference date ${referenceDate}`);
  }

  let age = reference.year - birth.year;
  const birthdayHasOccurred =
    reference.month > birth.month ||
    (reference.month === birth.month && reference.day >= birth.day);

  if (!birthdayHasOccurred) age -= 1;
  return age;
};

export const resolvePlayerAge = (
  player: PlayerProfile,
  referenceDate: string,
): number =>
  player.birthDate
    ? calculateAgeOnDate(player.birthDate, referenceDate)
    : player.age;
