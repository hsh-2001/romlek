import { ApiProperty } from '@nestjs/swagger';

export class CreateTripDtoClass {
  @ApiProperty()
  user_id: string;
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty()
  destination: string;
  @ApiProperty()
  startDate: Date;
  @ApiProperty()
  endDate: Date;
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
    user_id: string,
    destination: string,
    startDate: Date,
    endDate: Date,
    name?: string,
  ) {
    this.user_id = user_id;
    this.name = name;
    this.destination = destination;
    this.startDate = startDate;
    this.endDate = endDate;
  }
}
