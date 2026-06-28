'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { Home, Images, LogOut, PenLine, Search, Settings } from 'lucide-react';
import { getInitials } from '@/app/_components/AppShell';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';

type ActiveRoute = 'media';

const navItems = [
  { key: 'media', labelKey: 'nav.media', to: '/studio/media', icon: Images },
] as const;

const pageTitleKeys: Record<ActiveRoute, string> = {
  media: 'media.title',
};

export function StudioShell({ active, children }: { active: ActiveRoute; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = usePreferences();
  const displayName = user?.name || user?.username || user?.email || 'Welcome';
  const username = user?.username || 'you';
  const initials = getInitials(displayName);

  return (
    <main className="studio-shell">
      <aside className="studio-sidebar">
        <Link className="studio-brand" href="/studio/media" aria-label="Romlek Studio">
          R
        </Link>

        <nav className="studio-nav" aria-label="Studio">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} className={`studio-nav-item ${active === item.key ? 'active' : ''}`} href={item.to} aria-label={t(item.labelKey)}>
                <Icon size={20} aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
          <Link className="studio-nav-item" href="/feed" aria-label={t('nav.home')}>
            <Home size={20} aria-hidden="true" />
            <span>{t('nav.home')}</span>
          </Link>
        </nav>

        <Button className="studio-compose-button" type="primary">
          <PenLine size={18} aria-hidden="true" />
          <span>{t('nav.post')}</span>
        </Button>

        <button className="studio-account" type="button" onClick={() => void logout()}>
          <span className="mini-avatar studio-account-avatar">{initials}</span>
          <span>
            <strong>{displayName}</strong>
            <small>@{username}</small>
          </span>
          <LogOut size={17} aria-hidden="true" />
        </button>
      </aside>

      <section className="studio-workspace">
        <header className="studio-topbar">
          <div>
            <span className="studio-label">Romlek Studio</span>
            <strong>{t(pageTitleKeys[active])}</strong>
          </div>
          <div className="studio-topbar-actions">
            <div className="studio-search"><Search size={17} aria-hidden="true" /> {t('nav.search')}</div>
            <Button className="studio-settings" type="text" shape="circle" aria-label={t('profile.settings')} href="/profile"><Settings size={18} aria-hidden="true" /></Button>
          </div>
        </header>

        <div className="studio-content">
          <section className="studio-canvas">{children}</section>
        </div>
      </section>

      <nav className="studio-mobile-nav" aria-label="Studio">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} className={active === item.key ? 'active' : ''} href={item.to} aria-label={t(item.labelKey)}>
              <Icon size={22} aria-hidden="true" />
            </Link>
          );
        })}
        <Link href="/feed" aria-label={t('nav.home')}>
          <Home size={22} aria-hidden="true" />
        </Link>
      </nav>
    </main>
  );
}
