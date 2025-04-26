import { SessionService } from '$lib/services/session';
import { redirect } from '@sveltejs/kit';

export const actions = {
    logout: async (event) => {
        if (event.platform?.env.DB) {
            const sessionService = new SessionService(event.platform.env.DB);
            const token = event.cookies.get("session") ?? null;

            if (token) {
                await sessionService.invalidateSession(token);
                SessionService.deleteSessionTokenCookie(event);
            }
        }

        throw redirect(303, '/');
    },
    logoutAll: async (event) => {
        if (event.platform?.env.DB) {
            const sessionService = new SessionService(event.platform.env.DB);
            const token = event.cookies.get("session") ?? null;

            if (token) {
                await sessionService.invalidateAllSessions(event.locals.user.id);
                SessionService.deleteSessionTokenCookie(event);
            }
        }

        throw redirect(303, '/');
    },
}