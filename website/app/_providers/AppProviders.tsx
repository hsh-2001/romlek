'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios, { AxiosError, type AxiosRequestConfig, type Method } from 'axios';
import { ConfigProvider, theme as antdTheme } from 'antd';
import en from '@/i18n/locales/en.json';
import km from '@/i18n/locales/km.json';
import type { AuthPayload, AuthUser, LoginCredentials, RegisterCredentials } from '@/app/_types/auth';

type Locale = 'en' | 'km';
type ThemeMode = 'light' | 'dark';
type Messages = typeof en;
type TranslationValues = Record<string, string | number>;

interface ApiRequestOptions extends Omit<AxiosRequestConfig, 'data' | 'method' | 'url'> {
  method?: Method;
  body?: unknown;
}

type ApiClient = <T>(url: string, options?: ApiRequestOptions) => Promise<T>;

interface PreferencesContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: (key: string, values?: TranslationValues) => string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  api: ApiClient;
  login: (credentials: LoginCredentials) => Promise<AuthUser | null>;
  register: (credentials: RegisterCredentials) => Promise<AuthUser | null>;
  fetchUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const AuthContext = createContext<AuthContextValue | null>(null);

const messages: Record<Locale, Messages> = { en, km };
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
const oneYearInSeconds = 60 * 60 * 24 * 365;
const thirtyDaysInSeconds = 60 * 60 * 24 * 30;
const supportedLocales = ['en', 'km'] satisfies Locale[];
const supportedThemes = ['light', 'dark'] satisfies ThemeMode[];

const isLocale = (value: string | null): value is Locale => {
  return supportedLocales.includes(value as Locale);
};

const isThemeMode = (value: string | null): value is ThemeMode => {
  return supportedThemes.includes(value as ThemeMode);
};

const getCookie = (name: string) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];

  return value ? decodeURIComponent(value) : null;
};

const setCookie = (name: string, value: string, maxAge: number) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
};

const clearCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
};

const getMessageValue = (locale: Locale, key: string) => {
  return key.split('.').reduce<unknown>((value, part) => {
    if (value && typeof value === 'object' && part in value) {
      return (value as Record<string, unknown>)[part];
    }

    return undefined;
  }, messages[locale]);
};

const interpolate = (template: string, values?: TranslationValues) => {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, token) => String(values[token] ?? match));
};

const resolveTranslation = (locale: Locale, key: string, values?: TranslationValues) => {
  const result = getMessageValue(locale, key) ?? getMessageValue('en', key);

  return typeof result === 'string' ? interpolate(result, values) : key;
};

const resolveErrorMessage = (error: AxiosError) => {
  const data = error.response?.data;

  if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
    return data.message;
  }

  return error.message || 'Request failed.';
};

const extractToken = (payload: AuthPayload) => {
  return payload.token || payload.access_token || payload.data?.token || payload.data?.access_token || null;
};

const extractUser = (payload: AuthPayload): AuthUser | null => {
  if (payload.user) {
    return payload.user;
  }

  if (payload.data?.user) {
    return payload.data.user;
  }

  if (payload.data && 'id' in payload.data) {
    return payload.data as AuthUser;
  }

  if ('id' in payload) {
    return payload as AuthUser;
  }

  return null;
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedLocale = getCookie('romlek_locale');
    const storedTheme = getCookie('romlek_theme');
    const storedToken = getCookie('auth_token');

    if (isLocale(storedLocale)) {
      setLocaleState(storedLocale);
    }

    if (isThemeMode(storedTheme)) {
      setThemeState(storedTheme);
    }

    if (storedToken) {
      setTokenState(storedToken);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [locale, theme]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    setCookie('romlek_locale', nextLocale, oneYearInSeconds);
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    setCookie('romlek_theme', nextTheme, oneYearInSeconds);
  }, []);

  const t = useCallback((key: string, values?: TranslationValues) => resolveTranslation(locale, key, values), [locale]);

  const api = useCallback<ApiClient>(
    async <T,>(url: string, options: ApiRequestOptions = {}) => {
      const { body, headers, ...requestOptions } = options;
      try {
        const response = await axios.request<T>({
          baseURL: apiBaseUrl,
          url,
          data: body,
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
          },
          ...requestOptions,
        });

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            clearCookie('auth_token');
            setTokenState(null);
            setUser(null);

            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }

          throw new Error(resolveErrorMessage(error));
        }

        throw error;
      }
    },
    [token],
  );

  const setSession = useCallback((payload: AuthPayload) => {
    const nextToken = extractToken(payload);
    const nextUser = extractUser(payload);

    if (nextToken) {
      setTokenState(nextToken);
      setCookie('auth_token', nextToken, thirtyDaysInSeconds);
    }

    if (nextUser) {
      setUser(nextUser);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    const currentToken = token || getCookie('auth_token');
    if (!currentToken) {
      setUser(null);
      return null;
    }

    const payload = await api<AuthPayload>('/auth/me');
    const nextUser = extractUser(payload);
    setUser(nextUser);
    return nextUser;
  }, [api, token]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const payload = await api<AuthPayload>('/users/login', {
        method: 'POST',
        body: credentials,
      });

      setSession(payload);
      const nextUser = extractUser(payload);
      return nextUser || user;
    },
    [api, setSession, user],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const payload = await api<AuthPayload>('/auth/register', {
        method: 'POST',
        body: credentials,
      });

      setSession(payload);
      const nextUser = extractUser(payload);
      return nextUser || user;
    },
    [api, setSession, user],
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await api('/auth/logout', { method: 'POST' });
      } catch {
        // The local session should be cleared even if the server token is already invalid.
      }
    }

    clearCookie('auth_token');
    setTokenState(null);
    setUser(null);
    window.location.href = '/login';
  }, [api, token]);

  const preferencesValue = useMemo(
    () => ({ locale, setLocale, theme, setTheme, t }),
    [locale, setLocale, setTheme, t, theme],
  );

  const authValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      api,
      login,
      register,
      fetchUser,
      logout,
    }),
    [api, fetchUser, login, logout, register, token, user],
  );

  return (
    <PreferencesContext.Provider value={preferencesValue}>
      <AuthContext.Provider value={authValue}>
        <ConfigProvider
          theme={{
            algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            token: {
              borderRadius: 8,
              colorPrimary: '#0f766e',
              fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            },
          }}
        >
          {children}
        </ConfigProvider>
      </AuthContext.Provider>
    </PreferencesContext.Provider>
  );
}

export const usePreferencesContext = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within AppProviders');
  }

  return context;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AppProviders');
  }

  return context;
};
