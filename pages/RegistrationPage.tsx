import React from 'react';
import { ArrowRight, CheckCircle2, FileText, ShieldCheck, Trophy } from 'lucide-react';
import { useSeason } from '../hooks/useSeason';

const formatDate = (value?: string): string => {
  if (!value) return '尚未公布';
  return value.replaceAll('-', '/');
};

const RegistrationPage: React.FC = () => {
  const { activeSeason } = useSeason();

  return (
    <div className="min-h-[80vh] bg-white pb-24 pt-8 md:pt-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="border-b border-neutral-200 pb-10 md:pb-14">
          <span className="mb-3 block text-xs font-black uppercase tracking-[0.3em] text-brand-blue">
            Registration
          </span>
          <h1 className="font-display text-4xl font-black uppercase leading-tight tracking-tight text-brand-black md:text-7xl">
            D LEAGUE 2026/27
            <span className="block text-brand-blue">賽季報名</span>
          </h1>
          <p className="mt-6 max-w-3xl text-sm font-medium leading-7 text-neutral-600 md:text-base">
            不論是具競爭力的成熟球隊，或剛成立並希望累積正式比賽經驗的新球隊，都可以依照目前實力選擇希望參加的級別
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-px overflow-hidden border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
              <InfoBlock label="報名期間" value={`${formatDate(activeSeason.registrationStart)}－${formatDate(activeSeason.registrationEnd)}`} />
              <InfoBlock label="比賽地點" value={activeSeason.venue} />
              <InfoBlock label="賽事級別" value="L1／L2／L3" />
              <InfoBlock label="預計隊數" value="各級別 6 隊" />
              <InfoBlock label="賽制" value="雙循環" />
              <InfoBlock label="每隊場數" value="10 場" />
            </div>

            <section className="mt-12">
              <div className="mb-6 flex items-center">
                <Trophy className="mr-3 h-6 w-6 text-brand-blue" aria-hidden="true" />
                <h2 className="font-display text-3xl font-black uppercase tracking-tight text-brand-black">
                  升降級制度
                </h2>
              </div>

              <div className="space-y-4">
                {activeSeason.enabledLeagues.map((leagueId) => {
                  const league = activeSeason.leagues[leagueId];
                  if (!league) return null;

                  return (
                    <div key={leagueId} className="border border-neutral-200 bg-neutral-50 p-5 md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-display text-2xl font-black text-brand-black">{league.displayName}</p>
                          <p className="mt-2 text-sm font-medium leading-6 text-neutral-600">{league.description}</p>
                        </div>
                        <span className="shrink-0 bg-brand-black px-3 py-1 text-xs font-black tracking-widest text-white">
                          {league.shortName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-24 border border-neutral-200 bg-brand-black p-6 text-white md:p-8">
              <div className="mb-6 flex items-center">
                <ShieldCheck className="mr-3 h-6 w-6 text-brand-accent" aria-hidden="true" />
                <h2 className="font-display text-2xl font-black uppercase tracking-tight">審核與分級</h2>
              </div>

              <p className="text-sm font-medium leading-7 text-white/75">
                主辦單位將依球隊過往成績、主要球員組成、參賽經驗、紀律及各級別整體實力進行審核與分級，最終參賽級別以主辦單位公布結果為準
              </p>

              <div className="mt-8 space-y-3">
                <Feature text="可依球隊目前實力選擇希望參加的級別" />
                <Feature text="各級別預計錄取 6 支球隊" />
                <Feature text="正式實施升降級制度" />
                <Feature text="不設升降級附加賽" />
              </div>

              <div className="mt-10 flex flex-col gap-3">
                {activeSeason.registrationFormUrl && (
                  <a
                    href={activeSeason.registrationFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center bg-brand-accent px-6 py-3 text-sm font-black uppercase tracking-widest text-brand-black transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-black"
                  >
                    立即報名
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </a>
                )}

                {activeSeason.regulationsUrl && (
                  <a
                    href={activeSeason.regulationsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center border border-white/30 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-black"
                  >
                    <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                    查看競賽規程
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const InfoBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white p-6 md:p-8">
    <p className="text-xs font-black uppercase tracking-widest text-neutral-400">{label}</p>
    <p className="mt-2 font-display text-xl font-bold leading-7 text-brand-black">{value}</p>
  </div>
);

const Feature: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-start text-sm font-medium leading-6 text-white/80">
    <CheckCircle2 className="mr-3 mt-0.5 h-4 w-4 shrink-0 text-brand-accent" aria-hidden="true" />
    <span>{text}</span>
  </div>
);

export default RegistrationPage;
