import type { ROFL } from '$lib/services/parseRofl';
import type { PageServerLoad } from './$types';
import type { Match } from '../lib/models/match';

export const load: PageServerLoad = async ({ platform, locals }) => {
	return {
		matches: await retrieveMatches(platform!),
    user: locals.user
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