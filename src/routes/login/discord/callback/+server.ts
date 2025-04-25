import type { User } from "$lib/models/user";
import { discord } from "$lib/services/lucia";
import { SessionService } from "$lib/services/session";
import type { RequestEvent } from "@sveltejs/kit";
import { ArcticFetchError, generateCodeVerifier, OAuth2RequestError } from "arctic";


export async function GET(event: RequestEvent): Promise<Response> {
    try {
        const code = event.url.searchParams.get("code");
        const codeVerifier = generateCodeVerifier();
        const tokens = await discord.validateAuthorizationCode(code!, codeVerifier);

        const accessToken = tokens.accessToken();
        //const refreshToken = tokens.refreshToken();

        const discordUserResponse = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        });

        const discordUser: any = await discordUserResponse.json();
        console.log("Logged in Discord User:", discordUser);

        if (!event.platform?.env.DB) {
            console.error("Database connection is not available in Discord callback.");
            return new Response(null, { status: 500 });
        }

        let user = await event.platform.env.DB.prepare("SELECT * FROM user WHERE discord_id = ?").bind(discordUser.id).first<User>();

        if (!user) {
            const user = await event.platform.env.DB.prepare(
                "INSERT INTO user (discord_id, username, email, discord_avatar) VALUES (?, ?, ?, ?) RETURNING *"
            )
            .bind(discordUser.userId, discordUser.username, discordUser.email, discordUser.avatar)
            .first<User>();
        }

        if (!user) {
            console.error("Failed to find or create user.");
            return new Response(null, { status: 500 });
        }

        const sessionService = new SessionService(event.platform.env.DB);
        const sessionToken = sessionService.generateSessionToken();
        const session = await sessionService.createSession(sessionToken, user.id);
        
        SessionService.setSessionTokenCookie(event, sessionToken, session.expiresAt);
    
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
            }
        });
    } catch (e) {
        if (e instanceof OAuth2RequestError) {
            const code = e.code;
            console.error(`OAuth2 Request Error"`, code, e);
        }

        if (e instanceof ArcticFetchError) {
            const cause = e.cause;
            console.error(`Arctic Fetch Error:`, cause, e);
        }

        return new Response(null, {
            status: 400
        })
    }
    


}