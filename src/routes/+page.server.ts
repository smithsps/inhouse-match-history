import type { ROFL } from '$lib/services/parseRofl';
import { resourceLimits } from 'worker_threads';
import type { PageServerLoad } from './$types';

export type Match = {
  id: number;
  file_name: string;
  file_size: number;
  file_hash: string;
  match_date: string;
  data: ROFL; // TEXT in the database, parsed as ROFL object
  created_at: string;
  updated_at: string;
};

export const load: PageServerLoad = async ({ params, platform }) => {
	return {
		matches: await retrieveMatches(platform!),
	};
};

async function retrieveMatches(platform: Readonly<App.Platform>): Promise<Match[]> {
  const query = `
      SELECT * FROM matches
      ORDER BY match_date DESC;
  `;
  const result = await platform.env.DB.prepare(query).all<Match>();

  const matches = result.results.map((m: Match) => ({
    ...m,
    data: JSON.parse(m.data as any) as ROFL,
  }));

  return matches || [];
}