import React, { useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Instagram,
  ShieldCheck,
  Trophy,
  UsersRound,
} from 'lucide-react';
import RegistrationProgress from '../components/RegistrationProgress';
import { useSeason } from '../hooks/useSeason';
import type { RegistrationContentConfig } from '../types/season';

const formatDate = (value?: string): string => {
  if (!value) return '尚未公布';
  return value.replaceAll('-', '/');
};

const createFallbackContent = (): RegistrationContentConfig => ({
  intro: '正式報名資格、流程及錄取方式將由主辦單位依賽季公告',
  ageReferenceDate: '',
  minimumAge: 0,
  minimumPlayers: 0,
  maximumPlayers: 0,
  maximumStaff: 0,
  staffDescription: '隊職員資格依正式競賽規程辦理',
  steps: ['填寫正式報名表', '主辦單位審核', '公布錄取結果', '完成後續登錄程序'],
  faqItems: [],
  reviewDescription: '主辦單位將依正式競賽規程及各級別整體狀況進行審核與分級',
  reviewFeatures: [],
});

const RegistrationPage: React.FC = () => {
  const { activeSeason } = useSeason();
  const registrationContent = activeSeason.registrationContent ?? createFallbackContent();

  const leagueConfigs = useMemo(
    () =>
      activeSeason.enabledLeagues
        .map((leagueId) => activeSeason.leagues[leagueId])
        .filter((league): league is NonNullable<typeof league> => Boolean(league)),
    [activeSeason.enabledLeagues, activeSeason.leagues],
  );

  const expectedTeamCounts = new Set(leagueConfigs.map((league) => league.expectedTeamCount));
  const matchCounts = new Set(leagueConfigs.map((league) => league.matchesPerTeam));
  const formats = new Set(leagueConfigs.map((league) => league.format));

  const teamCountLabel =
    expectedTeamCounts.size === 1
      ? `各級別 ${leagueConfigs[0]?.expectedTeamCount ?? 0} 隊`
      : '依各級別公告';
  const matchCountLabel =
    matchCounts.size === 1 ? `${leagueConfigs[0]?.matchesPerTeam ?? 0} 場` : '依各級別公告';
  const formatLabel =
    formats.size === 1 && leagueConfigs[0]?.format === 'double-round-robin'
      ? '雙循環'
      : formats.size === 1 && leagueConfigs[0]?.format === 'triple-round-robin'
        ? '三循環'
        : '依各級別公告';
  const registrationOpen = activeSeason.status === 'registration';
  const ageLabel = registrationContent.minimumAge > 0
    ? `${formatDate(registrationContent.ageReferenceDate)} 當日年滿 ${registrationContent.minimumAge} 歲`
    : '依競賽規程公告';
  const playerCountLabel = registrationContent.minimumPlayers > 0
    ? `每隊 ${registrationContent.minimumPlayers}－${registrationContent.maximumPlayers} 人`
    : '依競賽規程公告';

  return (
    <div className="min-h-[80vh] bg-white pb-28 pt-8 md:pt-20">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="border-b border-neutral-200 pb-10 md:pb-14">
          <span className="mb-3 block text-xs font-black uppercase tracking-[0.3em] text-brand-blue">
            賽季報名
          </span>
          <h1 className="font-display text-4xl font-black uppercase leading-tight tracking-tight text-brand-black md:text-7xl">
            {activeSeason.displayName}
            <span className="block text-brand-blue">報名詳情</span>
          </h1>
          <p className="mt-6 max-w-3xl text-sm font-medium leading-7 text-neutral-600 md:text-base">
            {registrationContent.intro}
          </p>
          <span className={`mt-6 inline-flex rounded-full px-4 py-2 text-xs font-black ${registrationOpen ? 'bg-brand-accent text-brand-black' : 'bg-neutral-200 text-neutral-600'}`}>
            {registrationOpen ? `報名期間至 ${formatDate(activeSeason.registrationEnd)}` : '目前未開放報名'}
          </span>
        </div>

        <RegistrationProgress className="mt-8" />

        <div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-px overflow-hidden border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
              <InfoBlock label="報名期間" value={`${formatDate(activeSeason.registrationStart)}－${formatDate(activeSeason.registrationEnd)}`} />
              <InfoBlock label="比賽地點" value={activeSeason.venue} />
              <InfoBlock label="賽事級別" value={activeSeason.enabledLeagues.join('／')} />
              <InfoBlock label="預計隊數" value={teamCountLabel} />
              <InfoBlock label="賽制" value={formatLabel} />
              <InfoBlock label="每隊場數" value={matchCountLabel} />
              <InfoBlock label="球員年齡" value={ageLabel} />
              <InfoBlock label="球員人數" value={playerCountLabel} />
            </div>

            <section className="mt-12">
              <div className="mb-6 flex items-center">
                <ClipboardCheck className="mr-3 h-6 w-6 text-brand-blue" aria-hidden="true" />
                <h2 className="font-display text-3xl font-black uppercase tracking-tight text-brand-black">
                  報名流程
                </h2>
              </div>
              <ol className="grid gap-3 sm:grid-cols-2">
                {registrationContent.steps.map((step, index) => (
                  <li key={step} className="flex min-h-20 items-center border border-neutral-200 bg-neutral-50 px-5 py-4">
                    <span className="mr-4 font-display text-2xl font-black text-brand-blue">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-bold leading-6 text-brand-black">{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-12">
              <div className="mb-6 flex items-center">
                <UsersRound className="mr-3 h-6 w-6 text-brand-blue" aria-hidden="true" />
                <h2 className="font-display text-3xl font-black uppercase tracking-tight text-brand-black">
                  登錄資格
                </h2>
              </div>
              <div className="space-y-3 border-y border-neutral-200 py-5 text-sm font-medium leading-7 text-neutral-600">
                <p>
                  每隊球員最少登錄 {registrationContent.minimumPlayers} 人、最多 {registrationContent.maximumPlayers} 人
                </p>
                <p>
                  每隊最多登錄 {registrationContent.maximumStaff} 名隊職員，{registrationContent.staffDescription}
                </p>
                <p>錄取通知發出後，各隊須依主辦單位指定期限提交球員及隊職員資料</p>
              </div>
            </section>

            <section className="mt-12">
              <div className="mb-6 flex items-center">
                <Trophy className="mr-3 h-6 w-6 text-brand-blue" aria-hidden="true" />
                <h2 className="font-display text-3xl font-black uppercase tracking-tight text-brand-black">
                  升降級制度
                </h2>
              </div>

              <div className="space-y-4">
                {leagueConfigs.map((league) => (
                  <div key={league.id} className="border border-neutral-200 bg-neutral-50 p-5 md:p-6">
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
                ))}
              </div>
            </section>

            {registrationContent.faqItems.length > 0 && (
              <section className="mt-12">
                <div className="mb-6 flex items-center">
                  <CircleHelp className="mr-3 h-6 w-6 text-brand-blue" aria-hidden="true" />
                  <h2 className="font-display text-3xl font-black uppercase tracking-tight text-brand-black">
                    常見問題
                  </h2>
                </div>
                <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                  {registrationContent.faqItems.map((item) => (
                    <details key={item.question} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-brand-black">
                        {item.question}
                        <span className="text-xl font-medium text-brand-blue transition-transform group-open:rotate-45">＋</span>
                      </summary>
                      <p className="mt-3 pr-8 text-sm font-medium leading-7 text-neutral-600">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-24 border border-neutral-200 bg-brand-black p-6 text-white md:p-8">
              <div className="mb-6 flex items-center">
                <ShieldCheck className="mr-3 h-6 w-6 text-brand-accent" aria-hidden="true" />
                <h2 className="font-display text-2xl font-black uppercase tracking-tight">審核與分級</h2>
              </div>

              <p className="text-sm font-medium leading-7 text-white/75">
                {registrationContent.reviewDescription}
              </p>

              <div className="mt-8 space-y-3">
                {registrationContent.reviewFeatures.map((feature) => (
                  <Feature key={feature} text={feature} />
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3">
                {registrationOpen && activeSeason.registrationFormUrl && (
                  <a
                    href={activeSeason.registrationFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics-event="registration_click"
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
                    data-analytics-event="regulations_click"
                    className="inline-flex min-h-12 items-center justify-center border border-white/30 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white hover:text-brand-black focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-black"
                  >
                    <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                    查看競賽規程
                  </a>
                )}

                <a
                  href="https://www.instagram.com/d.league_tw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics-event="instagram_click"
                  className="inline-flex min-h-12 items-center justify-center border border-white/30 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white hover:text-brand-black"
                >
                  <Instagram className="mr-2 h-4 w-4" aria-hidden="true" />
                  聯絡主辦單位
                </a>
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
