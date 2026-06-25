import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { SHOW_REGISTRATION_NAV } from '../config/siteConfig';

interface NavItem {
  name: string;
  href: string;
  external?: boolean;
  children?: { name: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { name: '首頁', href: '/' },
  ...(SHOW_REGISTRATION_NAV ? [{ name: '賽季報名', href: '/registration' }] : []),
  { name: '賽程與結果', href: '/schedule' },
  { name: '積分榜', href: '/standings' },
  { name: '數據中心', href: '/stats' },
  { name: '最新消息', href: '/news' },
  { name: '賽事媒體', href: '/media' },
  {
    name: '盃賽',
    href: '#',
    children: [{ name: '2026 新春賀歲盃', href: '/cup' }],
  },
];

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileDropdownOpen(null);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileDropdownOpen(null);
      setMobileMenuOpen(false);
      if (
        document.activeElement instanceof HTMLElement &&
        headerRef.current?.contains(document.activeElement)
      ) {
        document.activeElement.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isPathActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const handleHomeScroll = (href: string) => {
    if (href === '/' && location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileDropdownOpen(null);
  };

  return (
    <header ref={headerRef} className="fixed top-0 z-[999] h-16 w-full overflow-x-visible border-b border-neutral-200 bg-white shadow-sm">
      <div className="container relative mx-auto flex h-full max-w-full items-center px-4 md:px-6">
        <div className="flex shrink-0 items-center">
          <Link
            to="/"
            className="group flex items-center"
            onClick={() => {
              closeMobileMenu();
              handleHomeScroll('/');
            }}
          >
            <img
              src="https://cdn.store-assets.com/s/783745/f/16299215.png"
              alt="D LEAGUE Logo"
              className="h-8 w-auto object-contain md:h-10"
            />
            <div className="ml-3 font-display uppercase leading-tight">
              <div className="whitespace-nowrap text-lg font-bold tracking-widest text-brand-black md:text-xl">
                D LEAGUE
              </div>
              <div className="hidden whitespace-nowrap text-[10px] font-medium tracking-widest text-brand-blue md:block md:text-xs">
                台南夢達七人足球聯賽
              </div>
            </div>
          </Link>
        </div>

        <nav className="absolute left-1/2 top-0 hidden h-16 max-w-[calc(100%-520px)] -translate-x-1/2 items-center gap-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider text-brand-black xl:flex 2xl:gap-7" aria-label="主要導覽">
          {NAV_ITEMS.map((item) => (
            <div key={item.name} className="group relative flex h-16 items-center">
              {item.children ? (
                <>
                  <button
                    type="button"
                    aria-haspopup="menu"
                    className="flex items-center transition-colors hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
                  >
                    {item.name}
                    <ChevronDown className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
                  </button>
                  <div
                    role="menu"
                    className="invisible absolute left-0 top-16 w-56 translate-y-2 overflow-hidden rounded-b-lg border border-neutral-100 bg-white opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        to={child.href}
                        role="menuitem"
                        className="block border-b border-neutral-50 px-6 py-4 text-sm text-neutral-600 transition-colors last:border-none hover:bg-neutral-50 hover:text-brand-blue focus:bg-neutral-50 focus:text-brand-blue focus:outline-none"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center transition-colors hover:text-brand-blue"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  to={item.href}
                  aria-current={isPathActive(item.href) ? 'page' : undefined}
                  className={`relative flex h-full items-center transition-colors ${
                    isPathActive(item.href) ? 'text-brand-blue' : 'hover:text-brand-blue'
                  }`}
                  onClick={() => handleHomeScroll(item.href)}
                >
                  {item.name}
                  {isPathActive(item.href) && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-blue" />
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg xl:hidden"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? '關閉選單' : '開啟選單'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 left-0 top-16 z-[1000] flex h-[calc(100vh-4rem)] w-full flex-col overflow-y-auto border-t border-neutral-100 bg-white p-6 shadow-xl xl:hidden">
          <div className="flex flex-col space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = item.children
                ? item.children.some((child) => isPathActive(child.href))
                : isPathActive(item.href);
              const expanded = mobileDropdownOpen === item.name;

              return (
                <div key={item.name} className="border-b border-neutral-100 pb-2">
                  {item.children ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setMobileDropdownOpen(expanded ? null : item.name)}
                        aria-expanded={expanded}
                        className={`flex min-h-11 w-full items-center justify-between py-2 font-display text-xl font-bold uppercase ${
                          active ? 'text-brand-blue' : 'text-brand-black'
                        }`}
                      >
                        {item.name}
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {expanded && (
                        <div className="mt-1 flex flex-col space-y-1 rounded-lg bg-neutral-50/70 p-2">
                          {item.children.map((child) => {
                            const childActive = isPathActive(child.href);
                            return (
                              <Link
                                key={child.name}
                                to={child.href}
                                aria-current={childActive ? 'page' : undefined}
                                className={`min-h-11 rounded-md px-3 py-3 text-base font-medium ${
                                  childActive ? 'bg-white text-brand-blue' : 'text-neutral-600 hover:text-brand-blue'
                                }`}
                                onClick={closeMobileMenu}
                              >
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-11 items-center justify-between py-2 font-display text-xl font-bold uppercase ${
                        active ? 'text-brand-blue' : 'text-brand-black hover:text-brand-blue'
                      }`}
                      onClick={() => {
                        closeMobileMenu();
                        handleHomeScroll(item.href);
                      }}
                    >
                      <span className="flex items-center">
                        {active && <span className="mr-3 h-0.5 w-5 bg-brand-blue" />}
                        {item.name}
                      </span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
