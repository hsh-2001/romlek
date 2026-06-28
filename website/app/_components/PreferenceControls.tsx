'use client';

import { Select } from 'antd';
import { usePreferences } from '@/app/_hooks/usePreferences';

export function PreferenceControls({ className = '' }: { className?: string }) {
  const { locale, setLocale, theme, setTheme, t } = usePreferences();

  return (
    <div
      className={`preference-controls grid w-full grid-cols-1 items-center gap-3 rounded-lg border border-slate-200 bg-white/90 p-3 text-sm font-bold text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 ${className}`}
      aria-label="Display preferences"
    >
      <label className="preference-field">
        <span>{t('prefs.language')}</span>
        <Select
          value={locale}
          className="preference-select"
          options={[
            { label: t('prefs.english'), value: 'en' },
            { label: t('prefs.khmer'), value: 'km' },
          ]}
          aria-label={t('prefs.language')}
          onChange={(value) => setLocale(value as 'en' | 'km')}
        />
      </label>

      <label className="preference-field">
        <span>{t('prefs.theme')}</span>
        <Select
          value={theme}
          className="preference-select"
          options={[
            { label: t('prefs.light'), value: 'light' },
            { label: t('prefs.dark'), value: 'dark' },
          ]}
          aria-label={t('prefs.theme')}
          onChange={(value) => setTheme(value as 'light' | 'dark')}
        />
      </label>
    </div>
  );
}
