import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTripDtoClass } from './dto/create-trip.dto';
import { UpdateTripDtoClass } from './dto/update-trip.dto';
import { TripRow } from '../common/models/trip';

const tripColumns = `
  id,
  user_id,
  name,
  destination,
  start_date,
  end_date,
  travel_style,
  companions,
  budget,
  address,
  google_map_url,
  place_details,
  preview_media_url,
  preview_media_urls,
  stops,
  priorities,
  notes,
  status,
  created_at,
  updated_at
`;

@Injectable()
export class TripRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAllTrips(userId?: string): Promise<TripRow[] | null> {
    const result = await this.databaseService.query(
      `
            SELECT ${tripColumns}
            FROM trips
            ${userId ? 'WHERE user_id = $1' : ''}
            ORDER BY start_date ASC, created_at DESC
        `,
      userId ? [userId] : [],
    );

    return (result?.rows as TripRow[]) ?? [];
  }

  async getTripById(id: string): Promise<TripRow | null> {
    const result = await this.databaseService.query(
      `
            SELECT ${tripColumns}
            FROM trips
            WHERE id = $1
        `,
      [id],
    );

    return (result?.rows[0] as TripRow) ?? null;
  }

  async createTrip(trip: CreateTripDtoClass): Promise<TripRow | null> {
    const result = await this.databaseService.query(
      `
            INSERT INTO trips (
              user_id,
              name,
              destination,
              start_date,
              end_date,
              travel_style,
              companions,
              budget,
              address,
              google_map_url,
              place_details,
              preview_media_url,
              preview_media_urls,
              stops,
              priorities,
              notes,
              status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17)
            RETURNING *
        `,
      [
        trip.user_id,
        trip.name ?? null,
        trip.destination,
        trip.startDate,
        trip.endDate,
        trip.travelStyle ?? null,
        trip.companions ?? null,
        trip.budget ?? null,
        trip.address ?? null,
        trip.googleMapUrl ?? null,
        trip.placeDetails ?? null,
        trip.previewMediaUrl ?? null,
        JSON.stringify(trip.previewMediaUrls ?? []),
        trip.stops ?? null,
        trip.priorities ?? null,
        trip.notes ?? null,
        trip.status ?? 'planning',
      ],
    );

    return (result?.rows[0] as TripRow) ?? null;
  }

  async updateTrip(id: string, trip: UpdateTripDtoClass): Promise<TripRow | null> {
    const result = await this.databaseService.query(
      `
            UPDATE trips
            SET
              name = COALESCE($2, name),
              destination = COALESCE($3, destination),
              start_date = COALESCE($4, start_date),
              end_date = COALESCE($5, end_date),
              travel_style = $6,
              companions = $7,
              budget = $8,
              address = $9,
              google_map_url = $10,
              place_details = $11,
              preview_media_url = $12,
              preview_media_urls = $13::jsonb,
              stops = $14,
              priorities = $15,
              notes = $16,
              status = COALESCE($17, status),
              updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `,
      [
        id,
        trip.name ?? null,
        trip.destination ?? null,
        trip.startDate ?? null,
        trip.endDate ?? null,
        trip.travelStyle ?? null,
        trip.companions ?? null,
        trip.budget ?? null,
        trip.address ?? null,
        trip.googleMapUrl ?? null,
        trip.placeDetails ?? null,
        trip.previewMediaUrl ?? null,
        JSON.stringify(trip.previewMediaUrls ?? []),
        trip.stops ?? null,
        trip.priorities ?? null,
        trip.notes ?? null,
        trip.status ?? 'planning',
      ],
    );

    return (result?.rows[0] as TripRow) ?? null;
  }
}
