import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TripService } from './trip.service';
import { CreateTripDtoClass } from './dto/create-trip.dto';
import { UpdateTripDtoClass } from './dto/update-trip.dto';
import { ApiBody } from '@nestjs/swagger';

@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Get()
  getTrip(@Query('user_id') userId?: string) {
    return this.tripService.getAllTrips(userId);
  }

  @Get(':id')
  getTripById(@Param('id') id: string) {
    return this.tripService.getTripById(id);
  }

  @Post()
  @ApiBody({ type: CreateTripDtoClass })
  createTrip(@Body() trip: CreateTripDtoClass) {
    return this.tripService.createTrip(trip);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateTripDtoClass })
  updateTrip(@Param('id') id: string, @Body() trip: UpdateTripDtoClass) {
    return this.tripService.updateTrip(id, trip);
  }
}
