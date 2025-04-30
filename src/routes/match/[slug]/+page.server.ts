import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { DraftState } from "$lib/models/draft";
import type { Match } from "$lib/models/match";
import type { ROFL } from "$lib/models/rofl";

export const load: PageServerLoad = async ({ platform, params, locals }) => {
    if (!params.slug) {
      redirect(303, '/');
    }

    const match = await retrieveMatch(platform!, params.slug);

    if (!match) {
        redirect(303, '/');
    }

    return {
        match,
        user: locals.user
    };
};

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
