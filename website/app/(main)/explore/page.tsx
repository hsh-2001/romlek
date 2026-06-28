'use client';

import { useMemo, useState } from 'react';
import { Input } from 'antd';
import { Search } from 'lucide-react';
import { AppShell } from '@/app/_components/AppShell';
import { usePreferences } from '@/app/_hooks/usePreferences';

export default function ExplorePage() {
  const { t } = usePreferences();
  const [query, setQuery] = useState('');
  const topics = useMemo(
    () => [
      { category: t('aside.trending'), title: 'Romlek Travel', count: `1,118 ${t('aside.posts')}` },
      { category: t('aside.technology'), title: 'Siem Reap', count: `12.8K ${t('aside.posts')}` },
      { category: t('aside.social'), title: 'Coastal Tours', count: `824 ${t('aside.posts')}` },
    ],
    [t],
  );
  const filteredTopics = topics.filter((topic) => `${topic.category} ${topic.title}`.toLowerCase().includes(query.trim().toLowerCase()));
  const latestPosts = [
    {
      id: 1,
      initials: 'RT',
      name: 'Romlek Tours',
      username: 'romlektours',
      body: 'Explore helps you find destinations, tour ideas, and trip stories beyond your travel feed.',
    },
    {
      id: 2,
      initials: 'TG',
      name: 'Travel Guides',
      username: 'travelguides',
      body: 'Save favorite places, collect trip media, and prepare polished destination notes from each journey.',
    },
  ];

  return (
    <AppShell active="explore">
      <header className="timeline-header flex items-center justify-between dark:!border-slate-800 dark:!bg-slate-950/90">
        <h1>{t('explore.title')}</h1>
      </header>

      <section className="border-b border-slate-100 p-3 dark:border-slate-800 md:p-4">
        <Input value={query} size="large" allowClear placeholder={t('explore.searchPlaceholder')} prefix={<Search size={18} aria-hidden="true" />} onChange={(event) => setQuery(event.target.value)} />
      </section>

      <section className="border-b border-slate-100 py-2 dark:border-slate-800">
        <h2 className="px-3 py-2 text-xl font-black text-slate-950 dark:text-slate-100 md:px-4 md:py-3">{t('explore.topics')}</h2>
        {filteredTopics.map((topic) => (
          <article key={topic.title} className="px-3 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-900 md:px-4 md:py-3">
            <span className="grid gap-1">
              <small className="text-slate-500 dark:text-slate-400">{topic.category}</small>
              <strong className="text-slate-950 dark:text-slate-100">{topic.title}</strong>
              <small className="text-slate-500 dark:text-slate-400">{topic.count}</small>
            </span>
          </article>
        ))}
      </section>

      <section className="py-2">
        <h2 className="px-3 py-2 text-xl font-black text-slate-950 dark:text-slate-100 md:px-4 md:py-3">{t('explore.latest')}</h2>
        {latestPosts.map((post) => (
          <article key={post.id} className="tweet-card dark:!border-slate-800 dark:hover:!bg-slate-900">
            <div className="mini-avatar">{post.initials}</div>
            <div className="tweet-body">
              <div className="tweet-meta">
                <strong>{post.name}</strong>
                <span>@{post.username}</span>
              </div>
              <p>{post.body}</p>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
