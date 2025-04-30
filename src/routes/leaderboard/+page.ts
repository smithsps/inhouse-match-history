import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data }) => {
    const { leaderboard } = data;
    const { ddragon } = await parent();

    return {
        leaderboard,
        ddragon
    }
};