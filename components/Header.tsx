import React, { useMemo, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSeason } from '../hooks/useSeason';

interface NavItem {
  name: string;
  href: string;
  external?: boolean;
  children?: { name: string; href: string }[];
}

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<string | null>(null);
  const location = useLocation();
  const { activeSeason } = useSeason();

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [{ name: '首頁', href: '/' }];

    if (activeSeason.status === 'registration') {
      items.push({ name: '賽季報名', href: '/registration' });
    }

    items.push(
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
    );

    return items;
  }, [activeSeason.status]);

  const handleHomeScroll = (href: string) => {
    if (href === '/' && location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileDropdownOpen(null);
  };

  const toggleMobileDropdown = (name: string) => {
    setMobileDropdownOpen((current) => (current === name ? null : name));
  };

  return (
    <header className="fixed top-0 z-[999] h-16 w-full overflow-x-visible border-b border-neutral-200 bg-white shadow-sm">
      <div className="container mx-auto flex h-full max-w-full items-center px-4 md:px-6">
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

        <nav className="ml-auto hidden items-center space-x-5 text-sm font-bold uppercase tracking-wider text-brand-black xl:flex 2xl:space-x-7">
          {navItems.map((item) => (
            <div key={item.name} className="group relative flex h-16 items-center">
              {item.children ? (
                <>
                  <button
                    type="button"
                    className="flex items-center transition-colors hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  >
                    {item.name}
                    <ChevronDown className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute left-0 top-16 w-56 translate-y-2 overflow-hidden rounded-b-lg border border-neutral-100 bg-white opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        to={child.href}
                        className="block border-b border-neutral-50 px-6 py-4 text-sm text-neutral-600 transition-colors last:border-none hover:bg-neutral-50 hover:text-brand-blue"
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
                  className="flex items-center transition-colors hover:text-brand-blue"
                  onClick={() => handleHomeScroll(item.href)}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="ml-auto p-1 xl:hidden"
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
            {navItems.map((item) => (
              <div key={item.name} className="border-b border-neutral-100 pb-2">
                {item.children ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleMobileDropdown(item.name)}
                      className="flex w-full items-center justify-between py-2 font-display text-xl font-bold uppercase text-brand-black"
                    >
                      {item.name}
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          mobileDropdownOpen === item.name ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {mobileDropdownOpen === item.name && (
                      <div className="mt-1 flex flex-col space-y-2 rounded-lg bg-neutral-50/70 pb-2 pl-4">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.href}
                            className="py-2 text-base font-medium text-neutral-600 hover:text-brand-blue"
                            onClick={closeMobileMenu}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className="flex items-center justify-between py-2 font-display text-xl font-bold uppercase text-brand-black hover:text-brand-blue"
                    onClick={() => {
                      closeMobileMenu();
                      handleHomeScroll(item.href);
                    }}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
