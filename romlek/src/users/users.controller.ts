import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDtoClass } from './dto/create-user.dto';
import { JwtAuthGuard } from '../common/guards/jwtAuth.guard';
import { ApiBody } from '@nestjs/swagger';
import { LoginDtoClass } from './dto/login.dto';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getUser() {
    return this.usersService.getUser();
  }

  @Post('register')
  @ApiBody({ type: CreateUserDtoClass })
  async registerUser(@Body() user: CreateUserDtoClass) {
    return await this.usersService.createUser(user);
  }

  @Post('login')
  @ApiBody({ type: LoginDtoClass })
  async loginUser(@Body() user: LoginDtoClass) {
    const result = await this.usersService.handleLogin(user);
    if (!result) {
      throw new Error('Invalid username or password');
    }
    return result;
  }
}
