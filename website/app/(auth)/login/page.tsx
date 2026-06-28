'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { AtSign, LockKeyhole, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
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
    <main className="auth-shell login-shell relative !text-slate-950 dark:!text-slate-100">
      <div className="login-topbar">
        <PreferenceControls variant="inline" className="login-preference-controls" />
      </div>

      <section className="auth-copy login-copy">
        <p className="login-brand"><WalletCards size={42} aria-hidden="true" /> Romlek</p>
        <h1 className="!text-slate-950 dark:!text-slate-100">{t('auth.loginTitle')}</h1>
        <p className="dark:!text-slate-300">{t('auth.loginBody')}</p>
        <div className="login-proof-strip" aria-label="Romlek highlights">
          <span><ShieldCheck size={17} aria-hidden="true" /> {t('auth.loginProofFeed')}</span>
          <span><Sparkles size={17} aria-hidden="true" /> {t('auth.loginProofPrivate')}</span>
        </div>
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
          <Link className="login-feed-link" href="/feed">{t('auth.viewFeed')}</Link>
        </div>
      </Form>
    </main>
  );
}
