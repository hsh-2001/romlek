import { ApiProperty } from '@nestjs/swagger';

export class UpdateTripDtoClass {
  @ApiProperty()
  name: string;
  @ApiProperty()
  description: string;
  @ApiProperty()
  startDate: Date;
  @ApiProperty()
  endDate: Date;

  constructor(
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
  ) {
    this.name = name;
    this.description = description;
    this.startDate = startDate;
    this.endDate = endDate;
  }
}
