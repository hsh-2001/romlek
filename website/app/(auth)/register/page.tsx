'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { AtSign, LockKeyhole, Mail, Phone, ShieldCheck, Sparkles, UserRound, WalletCards } from 'lucide-react';
import { PreferenceControls } from '@/app/_components/PreferenceControls';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';
import type { RegisterCredentials } from '@/app/_types/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = usePreferences();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (values: RegisterCredentials) => {
    setPending(true);
    setError('');

    try {
      await register(values);
      router.push('/feed');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : t('auth.registerError'));
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
        <h1 className="!text-slate-950 dark:!text-slate-100">{t('auth.registerTitle')}</h1>
        <p className="dark:!text-slate-300">{t('auth.registerBody')}</p>
        <div className="login-proof-strip" aria-label="Romlek highlights">
          <span><ShieldCheck size={17} aria-hidden="true" /> {t('auth.loginProofFeed')}</span>
          <span><Sparkles size={17} aria-hidden="true" /> {t('auth.loginProofPrivate')}</span>
        </div>
      </section>

      <Form className="auth-panel login-panel dark:!border-slate-800 dark:!bg-slate-900/90" layout="vertical" onFinish={submit}>
        <div className="login-panel-content">
          <div className="login-form-heading">
            <p>{t('auth.createAccount')}</p>
          </div>

          <Form.Item name="name" label={t('auth.name')} rules={[{ required: true }]}>
            <Input autoComplete="name" size="large" allowClear prefix={<UserRound size={18} aria-hidden="true" />} />
          </Form.Item>

          <Form.Item name="username" label={t('auth.username')} rules={[{ required: true }]}>
            <Input autoComplete="username" inputMode="text" size="large" allowClear prefix={<AtSign size={18} aria-hidden="true" />} />
          </Form.Item>

          <Form.Item name="email" label={t('auth.email')} rules={[{ required: true, type: 'email' }]}>
            <Input autoComplete="email" size="large" type="email" allowClear prefix={<Mail size={18} aria-hidden="true" />} />
          </Form.Item>

          <Form.Item name="phone" label={t('auth.phone')} rules={[{ required: true }]}>
            <Input autoComplete="tel" inputMode="tel" size="large" allowClear prefix={<Phone size={18} aria-hidden="true" />} />
          </Form.Item>

          <Form.Item name="password" label={t('auth.password')} rules={[{ required: true, min: 8 }]}>
            <Input.Password autoComplete="new-password" size="large" prefix={<LockKeyhole size={18} aria-hidden="true" />} />
          </Form.Item>

          {error ? <Alert showIcon={false} message={error} type="error" /> : null}

          <Button className="form-submit" htmlType="submit" size="large" type="primary" loading={pending}>
            {pending ? t('auth.creatingAccount') : t('auth.createAccount')}
          </Button>
        </div>

        <div className="login-divider" />

        <div className="login-panel-actions">
          <Link className="login-create-link" href="/login">{t('auth.signIn')}</Link>
          <Link className="login-feed-link" href="/feed">{t('auth.viewFeed')}</Link>
        </div>
      </Form>
    </main>
  );
}
