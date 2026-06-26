import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import type { UserLoginDto, CreateUserDto } from './dto/users.dto';
import { JwtAuthGuard } from '../common/guards/jwtAuth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getUser() {
    return this.usersService.getUser();
  }

  @Post('register')
  async registerUser(@Body() user: CreateUserDto) {
    return await this.usersService.createUser(user);
  }

  @Post('login')
  async loginUser(@Body() user: UserLoginDto) {
    const result = await this.usersService.handleLogin(user);
    if (!result) {
      throw new Error('Invalid username or password');
    }
    return result;
  }
}
