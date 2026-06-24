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
import { useSeason } from '../hooks/useSeason';

const formatDate = (value?: string): string => {
  if (!value) return '尚未公布';
  return value.replaceAll('-', '/');
};

const RegistrationPage: React.FC = () => {
  const { activeSeason } = useSeason();

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

  const steps = [
    '填寫正式報名表',
    '主辦單位審核球隊資料與實力',
    '公布錄取球隊及正式參賽級別',
    '依錄取通知完成相關程序',
    '提交球員及隊職員登錄資料',
    '公布正式賽程',
  ];

  const faqItems = [
    {
      question: '填寫報名表後就一定會錄取嗎？',
      answer: '不一定。主辦單位會依球隊過往成績、主要球員組成、參賽經驗、紀律及各級別整體實力進行審核，最終錄取名單以主辦單位公告為準',
    },
    {
      question: '可以自行選擇 L1、L2 或 L3 嗎？',
      answer: '報名時可以填寫希望參加的級別，但主辦單位會依整體實力進行分級，最終參賽級別以公布結果為準',
    },
    {
      question: '球員年齡及登錄人數有什麼限制？',
      answer: '球員須於 2026/11/01 當日年滿 15 歲，性別不限。每隊球員最少登錄 12 人、最多 20 人',
    },
    {
      question: '隊職員可以登錄多少人？',
      answer: '每隊最多登錄 3 名隊職員，可包含領隊、教練及管理等職務，其中領隊為必登職務',
    },
    {
      question: '每隊可以踢幾場比賽？',
      answer: '目前規劃 L1、L2、L3 均採雙循環，每隊共進行 10 場正式比賽',
    },
    {
      question: '經費較有限的 L3 球隊有其他方案嗎？',
      answer: 'L3 預計提供一隊工作人員合作名額，協助 L1、L2 比賽日的場地整理、設備設置及比賽期間撿球等工作，實際內容與資格由主辦單位另行確認',
    },
    {
      question: '報名費及後續期限在哪裡查看？',
      answer: '相關費用、繳交期限、球員登錄期限及其他錄取後程序，將於正式錄取通知中個別說明',
    },
  ];

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
            不論是具競爭力的成熟球隊，或剛成立並希望累積正式比賽經驗的新球隊，都可以依照目前實力選擇希望參加的級別
          </p>
          <span className={`mt-6 inline-flex rounded-full px-4 py-2 text-xs font-black ${registrationOpen ? 'bg-brand-accent text-brand-black' : 'bg-neutral-200 text-neutral-600'}`}>
            {registrationOpen ? `報名期間至 ${formatDate(activeSeason.registrationEnd)}` : '目前未開放報名'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-px overflow-hidden border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
              <InfoBlock label="報名期間" value={`${formatDate(activeSeason.registrationStart)}－${formatDate(activeSeason.registrationEnd)}`} />
              <InfoBlock label="比賽地點" value={activeSeason.venue} />
              <InfoBlock label="賽事級別" value={activeSeason.enabledLeagues.join('／')} />
              <InfoBlock label="預計隊數" value={teamCountLabel} />
              <InfoBlock label="賽制" value={formatLabel} />
              <InfoBlock label="每隊場數" value={matchCountLabel} />
              <InfoBlock label="球員年齡" value="2026/11/01 當日年滿 15 歲" />
              <InfoBlock label="球員人數" value="每隊 12－20 人" />
            </div>

            <section className="mt-12">
              <div className="mb-6 flex items-center">
                <ClipboardCheck className="mr-3 h-6 w-6 text-brand-blue" aria-hidden="true" />
                <h2 className="font-display text-3xl font-black uppercase tracking-tight text-brand-black">
                  報名流程
                </h2>
              </div>
              <ol className="grid gap-3 sm:grid-cols-2">
                {steps.map((step, index) => (
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
                <p>每隊球員最少登錄 12 人、最多 20 人</p>
                <p>每隊最多登錄 3 名隊職員，可包含領隊、教練及管理等職務，其中領隊為必登職務</p>
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

            <section className="mt-12">
              <div className="mb-6 flex items-center">
                <CircleHelp className="mr-3 h-6 w-6 text-brand-blue" aria-hidden="true" />
                <h2 className="font-display text-3xl font-black uppercase tracking-tight text-brand-black">
                  常見問題
                </h2>
              </div>
              <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                {faqItems.map((item) => (
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
                <Feature text={`各級別預計錄取 ${leagueConfigs[0]?.expectedTeamCount ?? 0} 支球隊`} />
                <Feature text="正式實施升降級制度" />
                <Feature text="不設升降級附加賽" />
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
