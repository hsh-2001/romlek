'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Segmented } from 'antd';
import { AtSign, CalendarDays, FileText, Image, LogOut, Mail, MapPin, Palette, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { AppShell, getInitials } from '@/app/_components/AppShell';
import { PreferenceControls } from '@/app/_components/PreferenceControls';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = usePreferences();
  const [activeProfileTab, setActiveProfileTab] = useState('posts');
  const [logoutPending, setLogoutPending] = useState(false);
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
  const profileStats = [
    { icon: MapPin, label: t('profile.visits'), value: '24' },
    { icon: FileText, label: t('profile.drafts'), value: '12' },
    { icon: Image, label: t('profile.mediaFiles'), value: '86' },
  ];
  const accountRows = [
    { icon: UserRound, label: t('profile.displayName'), value: displayName },
    { icon: AtSign, label: t('profile.username'), value: `@${username}` },
    { icon: Mail, label: t('profile.email'), value: email },
    { icon: CalendarDays, label: t('profile.joinedLabel'), value: t('profile.joined') },
  ];
  const activityRows = [
    { icon: Sparkles, title: t('profile.activityPost'), body: t('profile.activityPostBody') },
    { icon: MapPin, title: t('profile.activityReply'), body: t('profile.activityReplyBody') },
  ];

  const signOut = async () => {
    setLogoutPending(true);
    await logout();
    router.push('/login');
  };

  return (
    <AppShell active="profile">
      <div className="profile-page">
        <header className="profile-hero">
          <div className="profile-cover">
            <span><Sparkles size={16} aria-hidden="true" /> {t('profile.creatorWorkspace')}</span>
          </div>
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
            <div className="profile-stats" aria-label={t('profile.stats')}>
              {profileStats.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.label}>
                    <span><Icon size={17} aria-hidden="true" /></span>
                    <strong>{item.value}</strong>
                    <small>{item.label}</small>
                  </article>
                );
              })}
            </div>
          </div>
        </header>

        <section className="profile-content">
          <section className="profile-card profile-activity-card">
            <div className="profile-card-heading">
              <h2>{t('profile.activity')}</h2>
              <p>{t('profile.activityBody')}</p>
            </div>
            <Segmented value={activeProfileTab} className="profile-tabs" options={profileTabOptions} block onChange={(value) => setActiveProfileTab(String(value))} />
            <div className="profile-activity-list">
              {activityRows.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="profile-activity-item">
                    <span className="profile-activity-icon"><Icon size={18} aria-hidden="true" /></span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="profile-side">
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
              <Button className="profile-logout-button" danger loading={logoutPending} onClick={() => void signOut()}>
                <LogOut size={17} aria-hidden="true" />
                <span>{t('nav.signOut')}</span>
              </Button>
            </article>

            <article className="profile-card">
              <div className="profile-card-heading">
                <h2>{t('profile.settings')}</h2>
                <p>{t('profile.settingsBody')}</p>
              </div>
              <PreferenceControls className="profile-preference-controls" />
            </article>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
