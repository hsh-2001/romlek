export interface UserRow {
  id: string;
  username: string;
  password: string;
  email: string | null;
  phone: string | null;
  created_at: Date | null;
  modified_at: Date | null;
}
