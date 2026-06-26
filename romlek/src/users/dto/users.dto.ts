export interface UserRow {
  id: string;
  username: string;
  password: string;
  email: string | null;
  phone: string | null;
  created_at: Date | null;
  modified_at: Date | null;
}

export type CreateUserDto = Omit<UserRow, 'id' | 'created_at' | 'modified_at'>;

export type UserLoginDto = Pick<UserRow, 'username' | 'password'>;
