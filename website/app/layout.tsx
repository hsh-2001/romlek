import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import './globals.css';
import { AppProviders } from '@/app/_providers/AppProviders';

export const metadata: Metadata = {
  title: 'Romlek',
  description: 'A digital workspace for visits, media, captions, and social publishing.',
};

type Locale = 'en' | 'km';
type ThemeMode = 'light' | 'dark';

const readInitialLocale = (value: string | undefined): Locale => {
  return value === 'km' ? 'km' : 'en';
};

const readInitialTheme = (value: string | undefined): ThemeMode => {
  return value === 'dark' ? 'dark' : 'light';
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = readInitialLocale(cookieStore.get('romlek_locale')?.value);
  const initialTheme = readInitialTheme(cookieStore.get('romlek_theme')?.value);

  return (
    <html lang={initialLocale} className={initialTheme === 'dark' ? 'dark' : undefined} suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <AppProviders initialLocale={initialLocale} initialTheme={initialTheme}>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
