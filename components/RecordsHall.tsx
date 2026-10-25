import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CURRENT_SEASON_ID } from '../config/siteConfig';
import { getSeasonConfig } from '../config/seasons';
import { getCompletedSeasonRecords } from '../services/leagueRecords';

const RecordsHall: React.FC = () => {
  const recordsByLeague = useMemo(() => getCompletedSeasonRecords(), []);
  const leagues = getSeasonConfig(CURRENT_SEASON_ID).enabledLeagues;

  return (
    <section aria-labelledby="records-heading" className="mt-16 border-t border-neutral-200 pt-9 md:mt-20 md:pt-12">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-blue">D LEAGUE RECORDS</p>
      <h2 id="records-heading" className="mt-2 font-display text-3xl font-black uppercase tracking-wide text-brand-black md:text-4xl">
        紀錄殿堂
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600">
        由已完成、賽程完整的正式聯賽比分自動統計。跨賽季紀錄不會因上方數據篩選而改變；每筆標明賽季與級別。
      </p>
      <p className="mt-1 max-w-3xl text-xs leading-6 text-neutral-500">
        球員射手與單場進球紀錄暫不列入，待歷史進球事件與比分逐場核對後公布。
      </p>

      <div className="mt-8 space-y-10">
        {leagues.map((league) => {
          const records = recordsByLeague.get(league) ?? [];
          return (
            <section key={league} aria-label={`${league} 歷史紀錄`}>
              <div className="mb-3 flex items-baseline justify-between border-b-2 border-brand-black pb-2">
                <h3 className="font-display text-2xl font-bold text-brand-black">{league}</h3>
                <span className="text-xs font-medium text-neutral-500">
                  {records.length > 0 ? '已完成賽季' : '尚無可統計紀錄'}
                </span>
              </div>

              {records.length > 0 ? (
                <div className="grid gap-x-10 md:grid-cols-2">
                  {records.map((record) => (
                    <div key={record.kind} className="flex min-w-0 items-start justify-between gap-4 border-b border-neutral-100 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-neutral-600">{record.label}</p>
                        <p className="mt-1 break-words text-sm font-bold leading-6 text-brand-black">
                          {record.subject}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                          {record.seasonId.replace('-', '/')} · {record.detail}
                        </p>
                        {record.tiedCount > 1 && (
                          <p className="mt-1 text-xs text-neutral-500">
                            另有 {record.tiedCount - 1} 筆並列紀錄
                          </p>
                        )}
                        <Link
                          to={`/schedule?season=${record.seasonId}`}
                          className="mt-2 inline-flex min-h-11 items-center text-xs font-bold text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                        >
                          查看來源賽季賽程
                        </Link>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-display text-4xl font-black tabular-nums text-brand-blue">
                          {record.value}
                        </span>
                        <span className="ml-1 text-xs font-bold text-neutral-600">{record.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-5 text-sm leading-6 text-neutral-600">
                  此級別目前沒有已完成且賽程完整的歷史賽季，完成正式比賽後才會建立紀錄。
                </p>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
};

export default RecordsHall;
