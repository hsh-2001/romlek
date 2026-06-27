'use client';

import { useMemo, useState } from 'react';
import { Button, Segmented } from 'antd';
import { AtSign, CalendarDays, Mail, Palette, ShieldCheck, UserRound } from 'lucide-react';
import { AppShell, getInitials } from '@/app/_components/AppShell';
import { PreferenceControls } from '@/app/_components/PreferenceControls';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = usePreferences();
  const [activeProfileTab, setActiveProfileTab] = useState('posts');
  const profileTabOptions = useMemo(
    () => [
      { label: t('profile.posts'), value: 'posts' },
      { label: t('profile.replies'), value: 'replies' },
      { label: t('profile.media'), value: 'media' },
    ],
    [t],
  );
  const displayName = user?.name || user?.username || user?.email || 'Welcome';
  const username = user?.username || 'you';
  const email = user?.email || 'you@romlek.local';
  const initials = getInitials(displayName);
  const accountRows = [
    { icon: UserRound, label: t('profile.displayName'), value: displayName },
    { icon: AtSign, label: t('profile.username'), value: `@${username}` },
    { icon: Mail, label: t('profile.email'), value: email },
    { icon: CalendarDays, label: t('profile.joinedLabel'), value: t('profile.joined') },
  ];
  const activityRows = [
    { title: t('profile.activityPost'), body: t('feed.secondPost') },
    { title: t('profile.activityReply'), body: t('notifications.emptyBody') },
  ];

  return (
    <AppShell active="profile">
      <div className="profile-page">
        <header className="profile-hero">
          <div className="profile-cover" />
          <div className="profile-identity">
            <span className="profile-avatar">{initials}</span>
            <Button className="profile-edit-button" shape="round">
              {t('profile.edit')}
            </Button>
            <div>
              <h1>{displayName}</h1>
              <p>@{username}</p>
            </div>
            <p className="profile-bio">{t('profile.bio')}</p>
            <div className="profile-badges">
              <span><ShieldCheck size={16} aria-hidden="true" /> {t('profile.workspace')}</span>
              <span><Palette size={16} aria-hidden="true" /> {t('profile.appearance')}</span>
            </div>
          </div>
        </header>

        <section className="profile-grid">
          <article className="profile-card">
            <div className="profile-card-heading">
              <h2>{t('profile.account')}</h2>
              <p>{t('profile.accountBody')}</p>
            </div>
            <div className="profile-account-list">
              {accountRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="profile-account-row">
                    <span><Icon size={17} aria-hidden="true" /></span>
                    <div>
                      <small>{row.label}</small>
                      <strong>{row.value}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="profile-card">
            <div className="profile-card-heading">
              <h2>{t('profile.settings')}</h2>
              <p>{t('profile.settingsBody')}</p>
            </div>
            <PreferenceControls className="profile-preference-controls" />
          </article>
        </section>

        <section className="profile-card profile-activity-card">
          <div className="profile-card-heading">
            <h2>{t('profile.activity')}</h2>
            <p>{t('profile.activityBody')}</p>
          </div>
          <Segmented value={activeProfileTab} className="profile-tabs" options={profileTabOptions} block onChange={(value) => setActiveProfileTab(String(value))} />
          <div className="profile-activity-list">
            {activityRows.map((item) => (
              <article key={item.title} className="profile-activity-item">
                <span className="mini-avatar">{initials}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
