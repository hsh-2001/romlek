export interface TripRow {
  id: string;
  user_id: string;
  name: string | null;
  destination: string;
  start_date: Date | null;
  end_date: Date | null;
  travel_style: string | null;
  companions: string | null;
  budget: string | null;
  stops: string | null;
  priorities: string | null;
  notes: string | null;
  status: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}
