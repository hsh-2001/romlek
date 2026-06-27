'use client';

import { useState } from 'react';
import { Button } from 'antd';
import { SquarePen } from 'lucide-react';
import { AppShell } from '@/app/_components/AppShell';
import { usePreferences } from '@/app/_hooks/usePreferences';

const conversations = [
  { initials: 'NC', name: 'Next Community', username: 'nextjs', time: '8m', preview: 'The shared shell is ready for route-level pages.' },
  { initials: 'RC', name: 'React Community', username: 'react', time: '1h', preview: 'Form controls are now wrapped with responsive layout rules.' },
];

export default function MessagesPage() {
  const { t } = usePreferences();
  const [selected, setSelected] = useState(conversations[0]);

  return (
    <AppShell active="messages">
      <header className="timeline-header flex items-center justify-between dark:!border-slate-800 dark:!bg-slate-950/90">
        <h1>{t('messages.title')}</h1>
        <Button className="mr-3" shape="circle" aria-label={t('messages.newMessage')} icon={<SquarePen size={20} aria-hidden="true" />} />
      </header>

      <section className="grid min-h-[calc(100vh-73px)] grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="border-b border-slate-100 dark:border-slate-800 md:border-b-0 md:border-r">
          <h2 className="px-4 py-3 text-lg font-black text-slate-950 dark:text-slate-100">{t('messages.inbox')}</h2>
          {conversations.map((conversation) => (
            <Button
              key={conversation.username}
              className={`conversation-row grid w-full grid-cols-[40px_minmax(0,1fr)] gap-3 border-t border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 ${selected?.username === conversation.username ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
              type="text"
              onClick={() => setSelected(conversation)}
            >
              <span className="mini-avatar">{conversation.initials}</span>
              <span className="grid min-w-0 gap-0.5">
                <strong className="truncate text-slate-950 dark:text-slate-100">{conversation.name}</strong>
                <small className="truncate text-slate-500 dark:text-slate-400">@{conversation.username} · {conversation.time}</small>
                <span className="truncate text-sm text-slate-600 dark:text-slate-300">{conversation.preview}</span>
              </span>
            </Button>
          ))}
        </div>

        <section className="grid content-start gap-5 p-5 text-slate-600 dark:text-slate-300">
          {selected ? (
            <>
              <div className="flex items-center gap-3">
                <span className="mini-avatar">{selected.initials}</span>
                <span className="grid">
                  <strong className="text-slate-950 dark:text-slate-100">{selected.name}</strong>
                  <small className="text-slate-500 dark:text-slate-400">@{selected.username}</small>
                </span>
              </div>
              <p className="rounded-2xl bg-slate-100 p-4 leading-7 dark:bg-slate-900">{selected.preview}</p>
            </>
          ) : (
            <p>{t('messages.placeholder')}</p>
          )}
        </section>
      </section>
    </AppShell>
  );
}
