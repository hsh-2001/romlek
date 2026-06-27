'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { PreferenceControls } from '@/app/_components/PreferenceControls';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';
import type { LoginCredentials } from '@/app/_types/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = usePreferences();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

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
    <main className="auth-shell relative !text-slate-950 dark:!text-slate-100">
      <PreferenceControls className="mb-2 justify-self-stretch sm:justify-self-start lg:absolute lg:right-0 lg:top-4" />
      <section className="auth-copy">
        <p className="eyebrow">Romlek</p>
        <h1 className="!text-slate-950 dark:!text-slate-100">{t('auth.loginTitle')}</h1>
        <p className="dark:!text-slate-300">{t('auth.loginBody')}</p>
      </section>

      <Form className="auth-panel dark:!border-slate-800 dark:!bg-slate-900/90" layout="vertical" onFinish={submit}>
        <div>
          <p className="eyebrow">{t('auth.accountAccess')}</p>
          <h2 className="dark:!text-slate-100">{t('auth.signIn')}</h2>
        </div>

        <Form.Item name="username" label={t('auth.username')} rules={[{ required: true }]}>
          <Input autoComplete="username" inputMode="text" size="large" allowClear />
        </Form.Item>

        <Form.Item name="password" label={t('auth.password')} rules={[{ required: true }]}>
          <Input.Password autoComplete="current-password" size="large" />
        </Form.Item>

        {error ? <Alert showIcon={false} message={error} type="error" /> : null}

        <Button className="form-submit" htmlType="submit" size="large" type="primary" loading={pending}>
          {pending ? t('auth.signingIn') : t('auth.signIn')}
        </Button>

        <p className="muted dark:!text-slate-400">
          {t('auth.noAccount')} <Link href="/register">{t('auth.createOne')}</Link>
        </p>
      </Form>
    </main>
  );
}
