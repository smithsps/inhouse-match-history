import { initializeDdragon } from '$lib/services/ddragon';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data }) => {
    const { match, user } = data;
    const { ddragon } = await parent();

    return {
        match,
        user,
        ddragon
    }
};
