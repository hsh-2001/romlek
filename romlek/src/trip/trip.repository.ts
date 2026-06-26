import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTripDtoClass } from './dto/create-trip.dto';
import { TripRow } from '../common/models/trip';

@Injectable()
export class TripRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAllTrips(): Promise<TripRow[] | null> {
    const result = await this.databaseService.query(`
            SELECT id, user_id, destination, start_date, end_date, created_at, updated_at FROM trips
        `);

    return (result?.rows as TripRow[]) ?? [];
  }

  async createTrip(trip: CreateTripDtoClass): Promise<TripRow | null> {
    const result = await this.databaseService.query(
      `
            INSERT INTO trips (user_id, destination, start_date, end_date)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `,
      [trip.user_id, trip.description, trip.startDate, trip.endDate],
    );

    return (result?.rows[0] as TripRow) ?? null;
  }
}
