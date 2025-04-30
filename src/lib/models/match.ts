import type { ROFL } from '$lib/services/parseRofl';
import type { DraftState } from './draft';


export type Match = {
  id: number;
  match_id: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  match_date: string;
  data: ROFL; // TEXT in the database, parsed as ROFL object
  draft_data: DraftState; // TEXT in the database, parsed as DraftState object
  mvp_player: string;
  created_at: string;
  updated_at: string;
};
