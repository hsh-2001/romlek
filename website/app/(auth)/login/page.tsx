'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Dropdown, Form, Input } from 'antd';
import type { MenuProps } from 'antd';
import { AtSign, Languages, LockKeyhole, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';
import type { LoginCredentials } from '@/app/_types/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { locale, setLocale, theme, setTheme, t } = usePreferences();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const preferenceItems: MenuProps['items'] = [
    { key: 'language-label', label: <span className="login-menu-label">{t('prefs.language')}</span>, disabled: true },
    { key: 'locale-en', label: t('prefs.english') },
    { key: 'locale-km', label: t('prefs.khmer') },
    { type: 'divider' },
    { key: 'theme-label', label: <span className="login-menu-label">{t('prefs.theme')}</span>, disabled: true },
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

  const submit = async (values: LoginCredentials) => {
    setPending(true);
    setError('');

    try {
      await login(values);
      router.push('/feed');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : t('auth.loginError'));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-shell login-shell relative !text-slate-950 dark:!text-slate-100">
      <div className="login-topbar">
        <Dropdown
          menu={{ items: preferenceItems, onClick: selectPreference, selectedKeys: [`locale-${locale}`, `theme-${theme}`] }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button className="login-preference-button" type="text">
            <Languages size={16} aria-hidden="true" />
            <span>{locale === 'en' ? 'EN' : 'ខ្មែរ'}</span>
            {theme === 'dark' ? <Moon size={15} aria-hidden="true" /> : <Sun size={15} aria-hidden="true" />}
          </Button>
        </Dropdown>
      </div>

      <section className="auth-copy login-copy">
        <p className="login-brand">Romlek</p>
        <h1 className="!text-slate-950 dark:!text-slate-100">{t('auth.loginTitle')}</h1>
        <p className="dark:!text-slate-300">{t('auth.loginBody')}</p>
      </section>

      <Form className="auth-panel login-panel dark:!border-slate-800 dark:!bg-slate-900/90" layout="vertical" onFinish={submit}>
        <div className="login-panel-content">
          <div className="login-form-heading">
            <p>{t('auth.signIn')}</p>
          </div>

          <Form.Item name="username" label={t('auth.username')} rules={[{ required: true }]}>
            <Input autoComplete="username" inputMode="text" size="large" allowClear prefix={<AtSign size={18} aria-hidden="true" />} />
          </Form.Item>

          <Form.Item name="password" label={t('auth.password')} rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" size="large" prefix={<LockKeyhole size={18} aria-hidden="true" />} />
          </Form.Item>

          {error ? <Alert showIcon={false} message={error} type="error" /> : null}

          <Button className="form-submit" htmlType="submit" size="large" type="primary" loading={pending}>
            {pending ? t('auth.signingIn') : t('auth.signIn')}
          </Button>

          <Link className="login-forgot-link" href="/login">{t('auth.forgotPassword')}</Link>
        </div>

        <div className="login-divider" />

        <div className="login-panel-actions">
          <Link className="login-create-link" href="/register">{t('auth.createAccount')}</Link>
        </div>
      </Form>
    </main>
  );
}
