export interface TripRow {
  id: string;
  name: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  created_at: Date | null;
  modified_at: Date | null;
}
