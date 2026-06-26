import { ApiProperty } from '@nestjs/swagger';

export class CreateTripDtoClass {
  @ApiProperty()
  user_id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  startDate: Date;
  @ApiProperty()
  endDate: Date;

  constructor(
    user_id: string,
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
  ) {
    this.user_id = user_id;
    this.name = name;
    this.description = description;
    this.startDate = startDate;
    this.endDate = endDate;
  }
}
