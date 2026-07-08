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
  address: string | null;
  google_map_url: string | null;
  place_details: string | null;
  preview_media_url: string | null;
  preview_media_urls: string[] | null;
  stops: string | null;
  priorities: string | null;
  notes: string | null;
  status: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}
