import { TripRow } from '../common/models/trip';
import { CreateTripDtoClass } from './dto/create-trip.dto';
import { UpdateTripDtoClass } from './dto/update-trip.dto';

export interface ITripService {
  createTrip(trip: CreateTripDtoClass): Promise<TripRow | null>;
  getTripById(id: string): Promise<TripRow | null>;
  getAllTrips(): Promise<TripRow[] | null>;
  updateTrip(id: string, trip: UpdateTripDtoClass): Promise<TripRow | null>;
  deleteTrip(id: string): Promise<boolean>;
}
