import type { PageServerLoad, Actions } from './$types';
import type { Match } from '$lib/models/match';
import type { ROFL } from '$lib/models/rofl';
import type { DraftState } from '$lib/models/draft';

async function retrieveMatch(platform: Readonly<App.Platform>, matchHash: string): Promise<Match | null> {
  const result = await platform.env.DB.prepare("SELECT * FROM matches WHERE file_hash = ?").bind(matchHash).first<Match>();

  if (!result) {
    return null;
  }

  const match = {
    ...result,
    data: JSON.parse(result.data as any) as ROFL,
    draft_data: JSON.parse(result.draft_data as any) as DraftState
  }

  return match;
}

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  const match = await retrieveMatch(platform!, params.slug);
  
  if (!match) {
    return {
      status: 404,
      error: new Error('Match not found')
    };
  }

  // Only allow admins to edit matches
  if (!locals.user?.is_admin) {
    return {
      status: 403,
      error: new Error('Unauthorized')
    };
  }

  return {
    match
  };
};

export const actions: Actions = {
  default: async ({ request, params, platform, locals }) => {
    if (!locals.user?.is_admin) {
      return {
        status: 403,
        error: 'Unauthorized'
      };
    }

    const formData = await request.formData();
    const mvpPlayer = formData.get('mvp_player') as string;
    const matchDate = formData.get('match_date') as string;
    const draftData = formData.get('draft_data') as string;

    if (!matchDate) {
      return {
        status: 400,
        error: 'Missing required fields'
      };
    }

    try {
      await platform!.env.DB.prepare(`
        UPDATE matches 
        SET mvp_player = ?, 
            match_date = ?,
            draft_data = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE file_hash = ?
      `).bind(mvpPlayer, matchDate, draftData || null, params.slug).run();

      return {
        status: 200,
        success: true
      };
    } catch (error) {
      console.error('Error updating match:', error);
      return {
        status: 500,
        error: 'Failed to update match'
      };
    }
  }
}; 