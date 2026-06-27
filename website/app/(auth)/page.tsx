'use client';

import Link from 'next/link';
import { PreferenceControls } from '@/app/_components/PreferenceControls';
import { usePreferences } from '@/app/_hooks/usePreferences';

export default function HomePage() {
  const { t } = usePreferences();

  return (
    <main className="auth-shell relative !text-slate-950 dark:!text-slate-100">
      <PreferenceControls className="mb-2 justify-self-stretch sm:justify-self-start lg:absolute lg:right-0 lg:top-4" />
      <section className="auth-copy">
        <p className="eyebrow">Romlek</p>
        <h1 className="!text-slate-950 dark:!text-slate-100">{t('auth.homeTitle')}</h1>
        <p className="dark:!text-slate-300">{t('auth.homeBody')}</p>
      </section>

      <section className="auth-panel dark:!border-slate-800 dark:!bg-slate-900/90">
        <div>
          <p className="eyebrow">{t('auth.startHere')}</p>
          <h2 className="dark:!text-slate-100">{t('auth.welcomeBack')}</h2>
          <p className="muted dark:!text-slate-400">{t('auth.continueFeed')}</p>
        </div>

        <Link className="primary-link" href="/login">
          {t('auth.signIn')}
        </Link>
        <Link className="secondary-link" href="/register">
          {t('auth.createAccount')}
        </Link>
      </section>
    </main>
  );
}
