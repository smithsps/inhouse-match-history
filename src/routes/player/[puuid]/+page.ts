import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data }) => {
    const { player } = data;
    const { ddragon } = await parent();

    return {
        player,
        ddragon
    }
}; 