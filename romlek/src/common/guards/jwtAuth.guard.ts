/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import jwtConfig from '../utils/jwt-config.util';

export class JwtAuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1] as string;
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }
    try {
      await jwtConfig.verifyToken(token);
      return true;
    } catch (error) {
      console.error('Token verification error:', error); // Log the error for debugging
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
