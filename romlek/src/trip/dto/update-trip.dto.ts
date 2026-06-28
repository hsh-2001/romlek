import { ApiProperty } from '@nestjs/swagger';

export class UpdateTripDtoClass {
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false })
  destination?: string;
  @ApiProperty({ required: false })
  startDate?: Date;
  @ApiProperty({ required: false })
  endDate?: Date;
  @ApiProperty({ required: false })
  travelStyle?: string | null;
  @ApiProperty({ required: false })
  companions?: string | null;
  @ApiProperty({ required: false })
  budget?: string | null;
  @ApiProperty({ required: false })
  stops?: string | null;
  @ApiProperty({ required: false })
  priorities?: string | null;
  @ApiProperty({ required: false })
  notes?: string | null;
  @ApiProperty({ required: false })
  status?: string | null;

  constructor(
    name?: string,
    destination?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    this.name = name;
    this.destination = destination;
    this.startDate = startDate;
    this.endDate = endDate;
  }
}
