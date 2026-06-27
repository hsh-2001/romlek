'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { Bell, Home, Mail, PenLine, Search, User } from 'lucide-react';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';

type ActiveRoute = 'feed' | 'explore' | 'notifications' | 'messages' | 'profile';

const navItems = [
  { key: 'feed', labelKey: 'nav.home', to: '/feed', icon: Home },
  { key: 'explore', labelKey: 'nav.explore', to: '/explore', icon: Search },
  { key: 'notifications', labelKey: 'nav.notifications', to: '/notifications', icon: Bell },
  { key: 'messages', labelKey: 'nav.messages', to: '/messages', icon: Mail },
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
  const { user, logout } = useAuth();
  const { t } = usePreferences();
  const displayName = user?.name || user?.username || user?.email || 'Welcome';
  const initials = getInitials(displayName);
  const trends = [
    { category: t('aside.trending'), title: 'Next.js', count: `12.8K ${t('aside.posts')}` },
    { category: t('aside.technology'), title: 'React', count: `4,204 ${t('aside.posts')}` },
    { category: t('aside.social'), title: 'Romlek', count: `1,118 ${t('aside.posts')}` },
  ];
  const suggestions = [
    { initials: 'NC', name: 'Next Community', username: 'nextjs' },
    { initials: 'RC', name: 'React Community', username: 'react' },
  ];

  return (
    <main className="home-shell !bg-white !text-slate-950 dark:!bg-slate-950 dark:!text-slate-100">
      <aside className="home-sidebar dark:!border-slate-800">
        <Link className="home-brand dark:!text-slate-100" href="/feed">
          R
        </Link>

        <nav className="home-nav" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                className={`home-nav-item dark:!text-slate-100 dark:hover:!bg-slate-900 ${active === item.key ? 'active' : ''}`}
                href={item.to}
                aria-label={t(item.labelKey)}
              >
                <Icon size={24} aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <Button className="home-post-button" type="primary" aria-label={t('nav.post')}>
          <PenLine size={22} aria-hidden="true" />
          <span>{t('nav.post')}</span>
        </Button>

        <Button className="account-switcher dark:!text-slate-100 dark:hover:!bg-slate-900" type="text" onClick={() => void logout()}>
          <span className="mini-avatar">{initials}</span>
          <span>
            <strong>{displayName}</strong>
            <small>{t('nav.signOut')}</small>
          </span>
        </Button>
      </aside>

      <section className="timeline dark:!border-slate-800">{children}</section>

      <aside className="home-aside">
        <div className="search-box dark:!bg-slate-900 dark:!text-slate-400">{t('nav.search')}</div>

        <section className="aside-panel dark:!bg-slate-900">
          <h2>{t('aside.happening')}</h2>
          {trends.map((trend) => (
            <article key={trend.title} className="trend-item dark:hover:!bg-slate-800">
              <span>{trend.category}</span>
              <strong>{trend.title}</strong>
              <small>{trend.count}</small>
            </article>
          ))}
        </section>

        <section className="aside-panel dark:!bg-slate-900">
          <h2>{t('aside.follow')}</h2>
          {suggestions.map((person) => (
            <article key={person.username} className="suggestion-item dark:hover:!bg-slate-800">
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
