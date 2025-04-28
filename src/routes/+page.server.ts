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
  const result = await platform.env.DB.prepare("SELECT * FROM matches").all<Match>();

  const matches = result.results.map((m: Match) => ({
    ...m,
    data: JSON.parse(m.data as any) as ROFL,
  })).sort((a, b) => {
    try {
      // Attempt to parse match_id as a number for sorting
      const a_matchid = parseInt(a.match_id.split('_')[1]);
      const b_matchid = parseInt(b.match_id.split('_')[1]);

      return b_matchid - a_matchid;
    }
    catch (error) {
      // Sort to end
      return 1
    }
  });

  return matches || [];
}