import React from 'react';
import { ExternalLink, Facebook, Instagram, Mail, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSeasonConfig } from '../config/seasons';
import {
  CURRENT_SEASON_ID,
  D_LEAGUE_EMAIL_URL,
  D_LEAGUE_FACEBOOK_URL,
  D_LEAGUE_INSTAGRAM_URL,
  D_LEAGUE_YOUTUBE_URL,
  SHOW_REGISTRATION_NAV,
} from '../config/siteConfig';

const GGS_FALCON_URL = 'https://www.insun.com.tw/products/002-0089-20260513192648';

const SocialButton: React.FC<{ icon: React.ReactNode; href: string; label: string; external?: boolean }> = ({ icon, href, label, external = true }) => (
  <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-400 transition-all duration-300 hover:-translate-y-1 hover:border-brand-accent hover:bg-brand-accent hover:text-brand-black">{icon}</a>
);

const PartnerLogo: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => (
  <div className="group/logo flex h-10 w-auto items-center justify-center transition-all duration-300 md:h-12">
    <img src={src} alt={alt} className={`max-h-full w-auto object-contain transition-all duration-300 group-hover/logo:scale-105 ${className ?? ''}`} />
  </div>
);

const FooterLink: React.FC<React.PropsWithChildren<{ to: string }>> = ({ to, children }) => (
  <Link to={to} className="group flex min-h-11 items-center transition-colors hover:text-brand-accent">
    <span className="mr-0 h-0.5 w-0 bg-brand-accent transition-all duration-300 group-hover:mr-2 group-hover:w-2" />
    {children}
  </Link>
);

const Footer: React.FC = () => {
  const currentSeason = getSeasonConfig(CURRENT_SEASON_ID);

  return (
    <footer className="relative border-t border-neutral-900 bg-neutral-950 pb-6 pt-10 text-white md:pb-5 md:pt-20">
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mb-6 grid grid-cols-1 gap-8 md:mb-20 md:grid-cols-12 md:gap-10 lg:gap-16">
          <div className="flex flex-col items-start md:col-span-5">
            <div className="mb-1 md:mb-2"><span className="border-l-4 border-brand-accent pl-3 font-display text-2xl font-black uppercase tracking-widest text-white">D LEAGUE</span></div>
            <h2 className="mb-3 font-display text-3xl font-extrabold uppercase leading-tight tracking-wider text-white [-webkit-text-stroke:.5px_currentColor] md:mb-4 md:text-4xl md:font-black md:[-webkit-text-stroke:0px]">台南夢達七人足球聯賽</h2>
            <p className="mb-5 max-w-sm text-sm font-medium leading-relaxed text-neutral-500 md:mb-6">我們致力建立一個<span className="whitespace-nowrap">能讓更多人能夠踢、願意踢、</span><span className="whitespace-nowrap">享受踢的草根聯賽</span></p>
            <div className="flex items-center space-x-3 md:space-x-4"><SocialButton icon={<Instagram className="h-5 w-5" />} href={D_LEAGUE_INSTAGRAM_URL} label="Instagram" /><SocialButton icon={<Youtube className="h-5 w-5" />} href={D_LEAGUE_YOUTUBE_URL} label="YouTube" /><SocialButton icon={<Facebook className="h-5 w-5" />} href={D_LEAGUE_FACEBOOK_URL} label="Facebook" /><SocialButton icon={<Mail className="h-5 w-5" />} href={D_LEAGUE_EMAIL_URL} label="Email" external={false} /></div>
          </div>

          <div className="md:col-span-3">
            <h4 className="mb-3 border-l-4 border-brand-accent pl-3 font-display text-lg font-bold uppercase tracking-widest text-white md:mb-6">聯賽資訊</h4>
            <ul className="space-y-0 text-sm font-medium text-neutral-500">
              <li><FooterLink to="/about">關於 D LEAGUE</FooterLink></li>
              <li><FooterLink to="/#teams">參賽球隊</FooterLink></li>
              <li><FooterLink to="/schedule">賽程與結果</FooterLink></li>
              {SHOW_REGISTRATION_NAV && <li><FooterLink to="/registration">賽季資訊</FooterLink></li>}
              {currentSeason.regulationsUrl && (
                <li>
                  <a href={currentSeason.regulationsUrl} target="_blank" rel="noopener noreferrer" className="group flex min-h-11 items-center transition-colors hover:text-brand-accent">
                    <span className="mr-0 h-0.5 w-0 bg-brand-accent transition-all duration-300 group-hover:mr-2 group-hover:w-2" />
                    {currentSeason.shortName} 競賽規程
                    <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="mb-3 border-l-4 border-brand-accent pl-3 font-display text-lg font-bold uppercase tracking-widest text-white md:mb-6">官方合作夥伴</h4>

            <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <div className="group rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-700 hover:bg-neutral-900">
                <div className="flex min-h-12 items-center justify-start">
                  <PartnerLogo
                    alt="Dreamsport 夢達足球"
                    className="brightness-0 invert"
                    src="https://cdn.store-assets.com/s/783745/f/15684770.png"
                  />
                </div>
                <div className="mt-3 border-t border-neutral-800 pt-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white">Dreamsport Football</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-neutral-500">聯賽官方合作夥伴</p>
                </div>
              </div>

              <a
                href={GGS_FALCON_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="怪機絲 Ggs 賽事影像設備合作夥伴，了解 XbotGo Falcon，另開新分頁"
                className="group rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-accent/70 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                <div className="flex min-h-12 items-center justify-start">
                  <div className="font-display text-[24px] font-black leading-none tracking-tight text-white md:text-[26px]">
                    <span className="text-brand-accent">怪機絲</span>
                    <span className="ml-2 text-white">Ggs</span>
                  </div>
                </div>
                <div className="mt-3 border-t border-neutral-800 pt-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-accent">賽事影像設備合作夥伴</p>
                  <div className="mt-1 flex items-center text-xs font-medium leading-relaxed text-neutral-500 transition-colors group-hover:text-neutral-300">
                    <span>XbotGo Falcon</span>
                    <ExternalLink className="ml-1.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  </div>
                </div>
              </a>
            </div>

            <p className="mt-3 max-w-xl text-[11px] leading-relaxed text-neutral-600">
              以合作方案支持 D LEAGUE 賽事影像設備升級與比賽紀錄
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
