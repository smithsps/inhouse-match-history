import type { ROFL } from '$lib/services/parseRofl';


export type Match = {
  id: number;
  match_id: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  match_date: string;
  data: ROFL; // TEXT in the database, parsed as ROFL object
  created_at: string;
  updated_at: string;
};
