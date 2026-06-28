'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { Clapperboard, Home, User, WalletCards } from 'lucide-react';
import { PreferenceControls } from '@/app/_components/PreferenceControls';
import { usePreferences } from '@/app/_hooks/usePreferences';

type ActiveRoute = 'feed' | 'explore' | 'notifications' | 'messages' | 'profile' | 'studio';

const navItems = [
  { key: 'feed', labelKey: 'nav.home', to: '/feed', icon: Home },
  { key: 'studio', labelKey: 'nav.media', to: '/studio', icon: Clapperboard },
  { key: 'profile', labelKey: 'nav.profile', to: '/profile', icon: User },
] as const;

const getInitials = (value: string) => {
  return (
    value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'R'
  );
};

export function AppShell({ active, children }: { active: ActiveRoute; children: React.ReactNode }) {
  const { t } = usePreferences();
  const trends = [
    { category: t('aside.trending'), title: 'Siem Reap', count: `12.8K ${t('aside.posts')}` },
    { category: t('aside.technology'), title: 'Island Tours', count: `4,204 ${t('aside.posts')}` },
    { category: t('aside.social'), title: 'Romlek Travel', count: `1,118 ${t('aside.posts')}` },
  ];
  const suggestions = [
    { initials: 'TG', name: 'Travel Guides', username: 'travelguides' },
    { initials: 'RT', name: 'Romlek Tours', username: 'romlektours' },
  ];

  return (
    <main className="home-shell">
      <aside className="home-sidebar">
        <Link className="home-brand" href="/feed" aria-label="Romlek">
          <WalletCards size={23} aria-hidden="true" />
          <span>Romlek</span>
        </Link>

        <nav className="home-nav" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                className={`home-nav-item ${active === item.key ? 'active' : ''}`}
                href={item.to}
                aria-label={t(item.labelKey)}
              >
                <Icon size={24} aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="timeline">{children}</section>

      <aside className="home-aside">
        <div className="home-aside-header">
          <div className="search-box">{t('nav.search')}</div>
          <PreferenceControls variant="inline" className="home-preference-controls" />
        </div>

        <section className="aside-panel">
          <h2>{t('aside.happening')}</h2>
          {trends.map((trend) => (
            <article key={trend.title} className="trend-item">
              <span>{trend.category}</span>
              <strong>{trend.title}</strong>
              <small>{trend.count}</small>
            </article>
          ))}
        </section>

        <section className="aside-panel">
          <h2>{t('aside.follow')}</h2>
          {suggestions.map((person) => (
            <article key={person.username} className="suggestion-item">
              <span className="mini-avatar">{person.initials}</span>
              <span>
                <strong>{person.name}</strong>
                <small>@{person.username}</small>
              </span>
              <Button size="small" shape="round">{t('aside.followAction')}</Button>
            </article>
          ))}
        </section>
      </aside>
    </main>
  );
}

export { getInitials };
