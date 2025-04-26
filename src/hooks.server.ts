import { SessionService } from "$lib/services/session";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";


const authHandle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get("session") ?? null;
    if (token === null) {
        event.locals.user = null;
        event.locals.session = null;
        return resolve(event);
    }
    
    if (event.platform?.env.DB) {
        const sessionService = new SessionService(event.platform.env.DB);
        const { session, user } = await sessionService.validateSessionToken(token);

        if (session !== null) {
            SessionService.setSessionTokenCookie(event, token, session.expires_at);
        } else {
            SessionService.deleteSessionTokenCookie(event);
        }

        event.locals.user = user;
        event.locals.session = session;
    }

    return resolve(event);
}

export const handle = sequence(authHandle);