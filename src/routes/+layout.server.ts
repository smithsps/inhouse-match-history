import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }: { locals: App.Locals }) => {
  return {
    user: locals.user
  };
};
