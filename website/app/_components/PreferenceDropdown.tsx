'use client';

import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { Languages, Moon, Sun } from 'lucide-react';
import { usePreferences } from '@/app/_hooks/usePreferences';

export function PreferenceDropdown({ className = '' }: { className?: string }) {
  const { locale, setLocale, theme, setTheme, t } = usePreferences();

  const preferenceItems: MenuProps['items'] = [
    { key: 'language-label', label: <span className="preference-menu-label">{t('prefs.language')}</span>, disabled: true },
    { key: 'locale-en', label: t('prefs.english') },
    { key: 'locale-km', label: t('prefs.khmer') },
    { type: 'divider' },
    { key: 'theme-label', label: <span className="preference-menu-label">{t('prefs.theme')}</span>, disabled: true },
    { key: 'theme-light', label: t('prefs.light') },
    { key: 'theme-dark', label: t('prefs.dark') },
  ];

  const selectPreference: MenuProps['onClick'] = ({ key }) => {
    if (key === 'locale-en' || key === 'locale-km') {
      setLocale(key === 'locale-en' ? 'en' : 'km');
    }

    if (key === 'theme-light' || key === 'theme-dark') {
      setTheme(key === 'theme-light' ? 'light' : 'dark');
    }
  };

  return (
    <Dropdown
      menu={{ items: preferenceItems, onClick: selectPreference, selectedKeys: [`locale-${locale}`, `theme-${theme}`] }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button className={`preference-dropdown-button ${className}`.trim()} type="text" aria-label={`${t('prefs.language')} / ${t('prefs.theme')}`}>
        <Languages size={16} aria-hidden="true" />
        <span>{locale === 'en' ? 'EN' : 'ខ្មែរ'}</span>
        {theme === 'dark' ? <Moon size={15} aria-hidden="true" /> : <Sun size={15} aria-hidden="true" />}
      </Button>
    </Dropdown>
  );
}
