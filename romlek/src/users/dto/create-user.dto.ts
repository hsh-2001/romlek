import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDtoClass {
  @ApiProperty()
  username: string;
  @ApiProperty()
  password: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  phone: string;

  constructor(
    username: string,
    password: string,
    email: string,
    phone: string,
  ) {
    this.username = username;
    this.password = password;
    this.email = email;
    this.phone = phone;
  }
}
