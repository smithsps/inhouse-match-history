import { initializeDdragon } from '$lib/services/ddragon';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, data }) => {
    const ddragon = await initializeDdragon(fetch);
    const { user } = data;

    return {
        ddragon,
        user
    }
};
