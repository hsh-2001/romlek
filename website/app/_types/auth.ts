export interface AuthUser {
  id: string | number;
  name?: string;
  email?: string;
  username?: string;
  avatar?: string;
  [key: string]: unknown;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation?: string;
}

export interface AuthPayload {
  token?: string;
  access_token?: string;
  user?: AuthUser;
  data?: {
    token?: string;
    access_token?: string;
    user?: AuthUser;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
