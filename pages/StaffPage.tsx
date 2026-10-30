import React, { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import BackButton from '../components/BackButton';
import EmptyState from '../components/EmptyState';
import StaffAvatar from '../components/StaffAvatar';
import { isSeasonId } from '../config/seasons';
import { getTeamIdentity } from '../services/entityData';
import { getStaffHistory } from '../services/staffData';

const StaffPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const requestedSeason = searchParams.get('season');
  const history = useMemo(() => getStaffHistory(id), [id]);

  if (history.length === 0) {
    return (
      <div className="min-h-[75vh] bg-white px-4 py-16 md:py-28">
        <div className="mx-auto max-w-5xl">
          <EmptyState title="找不到此隊職員" description="此隊職員尚未登錄，或網址已失效" />
          <div className="mt-8 text-center">
            <BackButton fallbackTo="/" className="inline-flex min-h-11 items-center text-sm font-bold text-brand-blue hover:text-brand-black" />
          </div>
        </div>
      </div>
    );
  }

  const record = (isSeasonId(requestedSeason)
    ? history.find((item) => item.seasonId === requestedSeason)
    : undefined) ?? history[0];
  const { staff, team, season, seasonId } = record;
  const image = staff.image ?? history.find((item) => item.staff.image)?.staff.image;
  const teamHref = '/teams/' + encodeURIComponent(getTeamIdentity(team)) + '?season=' + seasonId;

  return (
    <div className="min-h-screen bg-white pb-24">
      <section className="border-b border-neutral-200 bg-neutral-50 px-4 py-8 md:px-12 md:py-10 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <BackButton fallbackTo={teamHref} className="inline-flex min-h-11 items-center text-xs font-bold text-neutral-500 hover:text-brand-black" />
          <div className="mt-5 flex min-w-0 items-center gap-4 sm:gap-6 lg:gap-8">
            <StaffAvatar key={staff.id} src={image} name={staff.name} large />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-blue sm:tracking-[0.16em]">
                D LEAGUE STAFF <span className="ml-2 text-neutral-500">{team.leagueId} · {season.shortName}</span>
              </p>
              <h1 className="mt-2 break-words font-display text-3xl font-black leading-tight tracking-tight text-brand-black sm:mt-3 sm:text-5xl lg:text-6xl">
                {staff.name}
              </h1>
              {staff.englishName && (
                <p className="mt-2 break-words text-[10px] font-semibold uppercase tracking-wider text-neutral-500 sm:text-xs lg:text-sm">
                  {staff.englishName}
                </p>
              )}
              <p className="mt-3 text-xs font-black tracking-wider text-brand-blue sm:text-sm">{staff.roles.join('／')}</p>
              <Link to={teamHref} className="mt-2 inline-flex min-h-11 items-center text-sm font-black text-brand-blue hover:text-brand-black sm:text-base lg:text-lg">
                {team.name}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-12 md:px-12 md:py-14">
        <section aria-labelledby="staff-details-heading">
          <div className="mb-5 flex items-center border-b border-neutral-200 pb-3">
            <UserRound className="mr-2 h-5 w-5 text-brand-blue" aria-hidden="true" />
            <h2 id="staff-details-heading" className="font-display text-2xl font-extrabold text-brand-black">隊職員資料</h2>
          </div>
          <dl className="grid gap-x-12 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-neutral-500">姓名</dt>
              <dd className="mt-1 text-base font-bold text-brand-black">{staff.name}</dd>
            </div>
            {staff.englishName && (
              <div>
                <dt className="text-xs font-semibold text-neutral-500">英文姓名</dt>
                <dd className="mt-1 break-words text-base font-bold text-brand-black">{staff.englishName}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold text-neutral-500">職務</dt>
              <dd className="mt-1 text-base font-bold text-brand-black">{staff.roles.join('、')}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-neutral-500">所屬球隊</dt>
              <dd className="mt-1"><Link to={teamHref} className="inline-flex min-h-11 items-center text-base font-bold text-brand-blue hover:text-brand-black">{team.name}</Link></dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="staff-history-heading">
          <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 id="staff-history-heading" className="font-display text-2xl font-extrabold text-brand-black">歷年任職</h2>
            <span className="text-xs font-semibold text-neutral-500">共 {new Set(history.map((item) => item.seasonId)).size} 個賽季</span>
          </div>
          <div className="divide-y divide-neutral-200">
            {history.map((item) => (
              <div key={item.seasonId + ':' + item.team.id} className="grid grid-cols-[76px_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[120px_minmax(0,1fr)_120px] sm:items-center">
                <span className="font-display text-base font-black text-brand-black sm:text-lg">{item.season.shortName}</span>
                <div className="min-w-0">
                  <Link to={'/teams/' + encodeURIComponent(getTeamIdentity(item.team)) + '?season=' + item.seasonId}
                    className="inline-flex min-h-11 items-center break-words text-sm font-bold text-brand-blue hover:text-brand-black">
                    {item.team.name}
                  </Link>
                  <p className="text-xs font-semibold text-neutral-500">{item.staff.roles.join('／')}</p>
                </div>
                <span className="col-start-2 text-xs font-bold text-neutral-500 sm:col-auto sm:text-right">{item.team.leagueId}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default StaffPage;
