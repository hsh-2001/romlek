'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { Bell, Compass, Home, LogOut, Mail, PenLine, Search, Settings, User } from 'lucide-react';
import { getInitials } from '@/app/_components/AppShell';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';

type ActiveRoute = 'feed' | 'explore' | 'notifications' | 'messages' | 'profile';

const navItems = [
  { key: 'feed', labelKey: 'nav.home', to: '/feed', icon: Home },
  { key: 'explore', labelKey: 'nav.explore', to: '/explore', icon: Compass },
  { key: 'notifications', labelKey: 'nav.notifications', to: '/notifications', icon: Bell },
  { key: 'messages', labelKey: 'nav.messages', to: '/messages', icon: Mail },
  { key: 'profile', labelKey: 'nav.profile', to: '/profile', icon: User },
] as const;

const pageTitleKeys: Record<ActiveRoute, string> = {
  feed: 'feed.title',
  explore: 'explore.title',
  notifications: 'notifications.title',
  messages: 'messages.title',
  profile: 'profile.title',
};

export function StudioShell({ active, children }: { active: ActiveRoute; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = usePreferences();
  const displayName = user?.name || user?.username || user?.email || 'Welcome';
  const username = user?.username || 'you';
  const initials = getInitials(displayName);
  const studioNotes = [
    { label: t('feed.today'), value: '12' },
    { label: t('feed.media'), value: '4' },
    { label: t('feed.unread'), value: '2' },
  ];

  return (
    <main className="studio-shell">
      <aside className="studio-sidebar">
        <Link className="studio-brand" href="/feed" aria-label="Romlek">
          R
        </Link>

        <nav className="studio-nav" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} className={`studio-nav-item ${active === item.key ? 'active' : ''}`} href={item.to} aria-label={t(item.labelKey)}>
                <Icon size={20} aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
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

          <aside className="studio-inspector" aria-label={t('feed.stats')}>
            <section className="studio-panel">
              <h2>{t('feed.stats')}</h2>
              <div className="studio-metrics">
                {studioNotes.map((note) => (
                  <span key={note.label}>
                    <strong>{note.value}</strong>
                    <small>{note.label}</small>
                  </span>
                ))}
              </div>
            </section>

            <section className="studio-panel">
              <h2>{t('aside.happening')}</h2>
              <article>
                <small>{t('aside.trending')}</small>
                <strong>Romlek</strong>
                <span>1,118 {t('aside.posts')}</span>
              </article>
              <article>
                <small>{t('aside.technology')}</small>
                <strong>Next.js</strong>
                <span>12.8K {t('aside.posts')}</span>
              </article>
            </section>
          </aside>
        </div>
      </section>

      <nav className="studio-mobile-nav" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} className={active === item.key ? 'active' : ''} href={item.to} aria-label={t(item.labelKey)}>
              <Icon size={22} aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
