'use client';

import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { Check, Languages, Moon, Palette, Sun } from 'lucide-react';
import { usePreferences } from '@/app/_hooks/usePreferences';

type PreferenceControlsVariant = 'panel' | 'inline';

export function PreferenceControls({
  className = '',
  variant = 'panel',
}: {
  className?: string;
  variant?: PreferenceControlsVariant;
}) {
  const { locale, setLocale, theme, setTheme, t } = usePreferences();

  const preferenceItems: MenuProps['items'] = [
    {
      key: 'language-label',
      label: <span className="preference-menu-label">{t('prefs.language')}</span>,
      disabled: true,
    },
    {
      key: 'locale-en',
      label: (
        <span className="preference-menu-item">
          {t('prefs.english')}
          {locale === 'en' ? <Check size={15} aria-hidden="true" /> : null}
        </span>
      ),
    },
    {
      key: 'locale-km',
      label: (
        <span className="preference-menu-item">
          {t('prefs.khmer')}
          {locale === 'km' ? <Check size={15} aria-hidden="true" /> : null}
        </span>
      ),
    },
    { type: 'divider' },
    {
      key: 'theme-label',
      label: <span className="preference-menu-label">{t('prefs.theme')}</span>,
      disabled: true,
    },
    {
      key: 'theme-light',
      label: (
        <span className="preference-menu-item">
          <Sun size={15} aria-hidden="true" />
          {t('prefs.light')}
          {theme === 'light' ? <Check size={15} aria-hidden="true" /> : null}
        </span>
      ),
    },
    {
      key: 'theme-dark',
      label: (
        <span className="preference-menu-item">
          <Moon size={15} aria-hidden="true" />
          {t('prefs.dark')}
          {theme === 'dark' ? <Check size={15} aria-hidden="true" /> : null}
        </span>
      ),
    },
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
      menu={{
        items: preferenceItems,
        onClick: selectPreference,
        selectedKeys: [`locale-${locale}`, `theme-${theme}`],
      }}
      classNames={{ root: 'romlek-preference-dropdown' }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button
        className={`preference-controls preference-trigger-button ${variant} ${className}`.trim()}
        type="text"
        aria-label={`${t('prefs.language')} / ${t('prefs.theme')}`}
      >
        <span className="preference-trigger-icon">
          <Languages size={16} aria-hidden="true" />
        </span>
        <span className="preference-trigger-copy">
          <strong>{locale === 'en' ? 'EN' : 'ខ្មែរ'}</strong>
          <small>{theme === 'dark' ? t('prefs.dark') : t('prefs.light')}</small>
        </span>
        <Palette size={16} aria-hidden="true" />
      </Button>
    </Dropdown>
  );
}
