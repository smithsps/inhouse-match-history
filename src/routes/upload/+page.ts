import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data }) => {
    const { ddragon } = await parent();

    return {
        ddragon,
        form: {}
    }
};
