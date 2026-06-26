import { HttpException, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UserLoginDto, UserRow } from './dto/users.dto';
import bcrypt from 'bcryptjs';
import jwtConfig from '../common/utils/jwt-config.util';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getUser() {
    return this.usersRepository.getUser();
  }

  async createUser(user: CreateUserDto): Promise<UserRow> {
    const existingUser = await this.findUserUsernameOrEmail(
      user.username,
      user.email || '',
    );
    if (existingUser) {
      throw new HttpException('Username or email already exists', 400);
    }
    const hashedPassword = user.password
      ? await this.hashPassword(user.password)
      : '';
    const newUser = { ...user, password: hashedPassword };
    return this.usersRepository.createUser(newUser);
  }

  async handleLogin(
    user: UserLoginDto,
  ): Promise<(Omit<UserRow, 'password'> & { token: string }) | null> {
    const foundUser = await this.findUserUsernameOrEmail(
      user.username,
      user.username,
    );
    if (!foundUser) {
      return null;
    }

    if (!user || !user.password) {
      throw new Error('User not found or password is missing');
    }

    const isPasswordValid = await this.comparePasswords(
      user.password,
      foundUser.password,
    );
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = await jwtConfig.generateToken(foundUser);
    const { password, ...userWithoutPassword } = foundUser;
    return { ...userWithoutPassword, token };
  }

  private async findUserUsernameOrEmail(
    username: string,
    email: string,
  ): Promise<UserRow | null> {
    return this.usersRepository.findUserUsernameOrEmail(username, email);
  }

  async findUserById(userId: string): Promise<UserRow | null> {
    const users = await this.getUser();
    return users.find((user) => user.id === userId) || null;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  private async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
