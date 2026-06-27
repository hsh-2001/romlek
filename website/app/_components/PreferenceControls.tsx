'use client';

import { Segmented } from 'antd';
import { usePreferences } from '@/app/_hooks/usePreferences';

export function PreferenceControls({ className = '' }: { className?: string }) {
  const { locale, setLocale, theme, setTheme, t } = usePreferences();

  return (
    <div
      className={`preference-controls grid w-full grid-cols-1 items-center gap-2 rounded-lg border border-slate-200 bg-white/90 p-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 ${className}`}
      aria-label="Display preferences"
    >
      <Segmented
        value={locale}
        className="language-segmented"
        options={[
          { label: 'English', value: 'en' },
          { label: 'ខ្មែរ', value: 'km' },
        ]}
        block
        aria-label={t('prefs.language')}
        onChange={(value) => setLocale(value as 'en' | 'km')}
      />

      <Segmented
        value={theme}
        className="preference-segmented"
        options={[
          { label: t('prefs.light'), value: 'light' },
          { label: t('prefs.dark'), value: 'dark' },
        ]}
        block
        aria-label={t('prefs.theme')}
        onChange={(value) => setTheme(value as 'light' | 'dark')}
      />
    </div>
  );
}
