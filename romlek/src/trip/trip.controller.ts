import { Body, Controller, Get, Post } from '@nestjs/common';
import { TripService } from './trip.service';
import { CreateTripDtoClass } from './dto/create-trip.dto';
import { ApiBody } from '@nestjs/swagger';

@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Get()
  getTrip() {
    return this.tripService.getAllTrips();
  }

  @Post()
  @ApiBody({ type: CreateTripDtoClass })
  createTrip(@Body() trip: CreateTripDtoClass) {
    return this.tripService.createTrip(trip);
  }
}
