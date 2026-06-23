import React from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';

const SocialButton: React.FC<{ icon: React.ReactNode; href: string; label: string }> = ({
  icon,
  href,
  label,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-400 transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent hover:bg-brand-accent hover:text-brand-black"
  >
    {icon}
  </a>
);

const PartnerLogo: React.FC<{ src: string; className?: string }> = ({ src, className }) => (
  <div className="group/logo flex h-8 w-auto items-center justify-center transition-all duration-300">
    <img
      src={src}
      alt="D LEAGUE 合作夥伴"
      loading="lazy"
      className={`max-h-full w-auto object-contain transition-all duration-300 group-hover/logo:scale-105 ${className ?? ''}`}
    />
  </div>
);

const FooterLink: React.FC<React.PropsWithChildren<{ to: string }>> = ({ to, children }) => (
  <Link to={to} className="group flex items-center transition-colors hover:text-brand-accent">
    <span className="mr-0 h-0.5 w-0 bg-brand-accent transition-all duration-300 group-hover:mr-2 group-hover:w-2" />
    {children}
  </Link>
);

const Footer: React.FC = () => {
  const { activeSeason, activeSeasonId, setActiveSeason } = useSeason();
  const navigate = useNavigate();

  const showPastSeason = activeSeasonId !== '2025-26';

  const openPastSeason = () => {
    setActiveSeason('2025-26');
    navigate('/?season=2025-26');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-neutral-900 bg-neutral-950 pb-2 pt-12 text-white md:pb-5 md:pt-20">
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mb-8 grid grid-cols-1 gap-12 md:mb-20 md:grid-cols-12 lg:gap-16">
          <div className="flex flex-col items-start md:col-span-5">
            <div className="mb-1 md:mb-2">
              <span className="border-l-4 border-brand-accent pl-3 font-display text-2xl font-black uppercase tracking-widest text-white">
                D LEAGUE
              </span>
            </div>

            <h2 className="mb-4 font-display text-3xl font-black uppercase leading-tight tracking-wider text-white [-webkit-text-stroke:.5px_currentColor] md:text-4xl md:[-webkit-text-stroke:0px]">
              台南夢達七人足球聯賽
            </h2>

            <p className="mb-6 max-w-sm text-sm font-medium leading-relaxed text-neutral-500">
              我們致力建立一個
              <span className="whitespace-nowrap">能讓更多人能夠踢、願意踢、</span>
              <span className="whitespace-nowrap">享受踢的草根聯賽</span>
            </p>

            <div className="flex items-center space-x-4">
              <SocialButton icon={<Instagram className="h-5 w-5" />} href="https://www.instagram.com/d.league_tw/" label="Instagram" />
              <SocialButton icon={<Youtube className="h-5 w-5" />} href="https://www.youtube.com/@DreamSportFootball" label="YouTube" />
              <SocialButton icon={<Facebook className="h-5 w-5" />} href="https://www.facebook.com/profile.php?id=61576222172219" label="Facebook" />
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="mb-8 border-l-4 border-brand-accent pl-3 font-display text-lg font-bold uppercase tracking-widest text-white">
              聯賽資訊
            </h4>
            <ul className="space-y-4 text-sm font-medium text-neutral-500">
              <li><FooterLink to="/about">關於 D LEAGUE</FooterLink></li>
              <li><FooterLink to="/#teams">參賽球隊</FooterLink></li>
              <li><FooterLink to="/schedule">賽程與結果</FooterLink></li>
              {activeSeason.status === 'registration' && (
                <li><FooterLink to="/registration">賽季報名</FooterLink></li>
              )}
              {activeSeason.regulationsUrl && (
                <li>
                  <a
                    href={activeSeason.regulationsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center transition-colors hover:text-brand-accent"
                  >
                    <span className="mr-0 h-0.5 w-0 bg-brand-accent transition-all duration-300 group-hover:mr-2 group-hover:w-2" />
                    {activeSeason.shortName} 競賽規程
                  </a>
                </li>
              )}
              {showPastSeason && (
                <li>
                  <button
                    type="button"
                    onClick={openPastSeason}
                    className="group flex items-center text-left transition-colors hover:text-brand-accent"
                  >
                    <span className="mr-0 h-0.5 w-0 bg-brand-accent transition-all duration-300 group-hover:mr-2 group-hover:w-2" />
                    2025/26 過往賽事
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="mb-8 border-l-4 border-brand-accent pl-3 font-display text-lg font-bold uppercase tracking-widest text-white">
              官方合作夥伴
            </h4>
            <div className="flex max-w-sm flex-wrap items-center justify-start gap-8">
              <PartnerLogo className="brightness-0 invert" src="https://cdn.store-assets.com/s/783745/f/15686789.png" />
              <PartnerLogo className="brightness-0 invert" src="https://cdn.store-assets.com/s/783745/f/15684766.png" />
              <PartnerLogo className="brightness-0 invert" src="https://cdn.store-assets.com/s/783745/f/15684770.png" />
              <PartnerLogo src="https://cdn.store-assets.com/s/783745/f/15684768.png" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
