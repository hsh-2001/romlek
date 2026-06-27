import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserRow } from './dto/users.dto';
import { CreateUserDtoClass } from './dto/create-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getUser(): Promise<UserRow[]> {
    const result = await this.databaseService.query<UserRow>(`
      SELECT id, username, email, phone, created_at, modified_at
      FROM users
      ORDER BY created_at DESC NULLS LAST
    `);

    return result?.rows ?? [];
  }

  async createUser(user: CreateUserDtoClass): Promise<UserRow> {
    const result = await this.databaseService.query<UserRow>(
      `
      INSERT INTO users (username, password, email, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, password, email, phone, created_at, modified_at
    `,
      [user.username, user.password, user.email, user.phone],
    );

    return result?.rows[0] ?? null;
  }

  async findUserUsernameOrEmail(
    username: string,
    email: string,
  ): Promise<UserRow | null> {
    const result = await this.databaseService.query<UserRow>(
      `
      SELECT id, username, password, email, phone, created_at, modified_at
      FROM users
      WHERE username = $1 OR email = $2
    `,
      [username, email],
    );

    return result?.rows[0] ?? null;
  }
}
