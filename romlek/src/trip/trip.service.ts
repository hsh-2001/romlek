import { Injectable } from '@nestjs/common';
import { ITripService } from './trip.interface';
import { TripRow } from '../common/models/trip';
import { CreateTripDtoClass } from './dto/create-trip.dto';
import { UpdateTripDtoClass } from './dto/update-trip.dto';
import { TripRepository } from './trip.repository';

@Injectable()
export class TripService implements ITripService {
  constructor(private readonly tripRepository: TripRepository) {}

  createTrip(trip: CreateTripDtoClass): Promise<TripRow | null> {
    return this.tripRepository.createTrip(trip);
  }
  getTripById(id: string): Promise<TripRow | null> {
    throw new Error('Method not implemented.');
  }
  getAllTrips(): Promise<TripRow[] | null> {
    return this.tripRepository.getAllTrips();
  }
  updateTrip(id: string, trip: UpdateTripDtoClass): Promise<TripRow | null> {
    throw new Error('Method not implemented.');
  }
  deleteTrip(id: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
