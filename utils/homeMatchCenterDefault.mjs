/**
 * Home Match Centre: prioritize results on the matchday and for the next
 * three complete Taipei calendar days. After that show upcoming fixtures.
 * Date keys must be YYYY-MM-DD in Asia/Taipei, not UTC or browser local time.
 *
 * @param {{
 *   todayKey: string,
 *   finishedDateKeys: readonly string[],
 *   hasUpcoming: boolean
 * }} options
 * @returns {'Results' | 'Upcoming'}
 */
export const getDefaultHomeMatchCenterFilter = ({
  todayKey,
  finishedDateKeys,
  hasUpcoming,
}) => {
  const dayStart = Date.parse(`${todayKey}T00:00:00Z`);
  const hasRecentResult = Number.isFinite(dayStart) && finishedDateKeys.some((dateKey) => {
    const finishedDay = Date.parse(`${dateKey}T00:00:00Z`);
    const daysSinceMatch = (dayStart - finishedDay) / 86_400_000;
    return Number.isInteger(daysSinceMatch) && daysSinceMatch >= 0 && daysSinceMatch <= 3;
  });

  if (hasRecentResult) return 'Results';
  return hasUpcoming ? 'Upcoming' : 'Results';
};
