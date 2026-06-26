import { CreateUserDtoClass } from '../dto/create-user.dto';
import { LoginDtoClass } from '../dto/login.dto';
import { UserRow } from '../dto/users.dto';

export interface IUserService {
  createUser(user: CreateUserDtoClass): Promise<UserRow>;
  handleLogin(
    user: LoginDtoClass,
  ): Promise<(Omit<UserRow, 'password'> & { token: string }) | null>;
}
