'use client';

import { useMemo, useState } from 'react';
import { Segmented } from 'antd';
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { AppShell } from '@/app/_components/AppShell';
import { usePreferences } from '@/app/_hooks/usePreferences';

export default function NotificationsPage() {
  const { t } = usePreferences();
  const [activeNotificationTab, setActiveNotificationTab] = useState('all');
  const notificationTabOptions = useMemo(
    () => [
      { label: t('notifications.all'), value: 'all' },
      { label: t('notifications.mentions'), value: 'mentions' },
    ],
    [t],
  );
  const notifications = [
    { id: 1, icon: Heart, title: 'Romlek liked your update', body: '12m' },
    { id: 2, icon: MessageCircle, title: 'Next Community replied to your post', body: '38m' },
    { id: 3, icon: UserPlus, title: 'React Community followed you', body: '1h' },
  ];

  return (
    <AppShell active="notifications">
      <header className="timeline-header dark:!border-slate-800 dark:!bg-slate-950/90">
        <h1>{t('notifications.title')}</h1>
        <Segmented value={activeNotificationTab} className="timeline-segmented" options={notificationTabOptions} block onChange={(value) => setActiveNotificationTab(String(value))} />
      </header>

      <section className="grid justify-items-start gap-3 border-b border-slate-100 px-6 py-10 text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <Bell size={42} aria-hidden="true" />
        <h2 className="text-2xl font-black text-slate-950 dark:text-slate-100">{t('notifications.emptyTitle')}</h2>
        <p className="max-w-md leading-7">{t('notifications.emptyBody')}</p>
      </section>

      {notifications.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.id} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-4 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900">
            <Icon size={20} aria-hidden="true" />
            <span className="grid gap-1">
              <strong className="text-slate-950 dark:text-slate-100">{item.title}</strong>
              <small>{item.body}</small>
            </span>
          </article>
        );
      })}
    </AppShell>
  );
}
