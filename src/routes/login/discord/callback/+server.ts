import type { User } from "$lib/models/user";
import { discord } from "$lib/services/discord-auth";
import { SessionService } from "$lib/services/session";
import type { RequestEvent } from "@sveltejs/kit";
import { ArcticFetchError, generateCodeVerifier, OAuth2RequestError } from "arctic";


export async function GET(event: RequestEvent): Promise<Response> {
    try {
        const code = event.url.searchParams.get("code");
        const tokens = await discord.validateAuthorizationCode(code!, null);

        const accessToken = tokens.accessToken();
        //const refreshToken = tokens.refreshToken();

        const discordUserResponse = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        });

        const discordUser: any = await discordUserResponse.json();
        console.log("Logged in Discord User:", discordUser);

        let user = await event.platform!.env.DB.prepare("SELECT * FROM users WHERE discord_id = ?").bind(discordUser.id).first<User>();

        if (!user) {
            user = await event.platform!.env.DB.prepare(
                "INSERT INTO users (discord_id, username, email, discord_avatar) VALUES (?, ?, ?, ?) RETURNING *"
            )
            .bind(discordUser.id, discordUser.username, discordUser.email, discordUser.avatar)
            .first<User>();
        }

        if (!user) {
            console.error("Failed to find or create user.");
            return new Response(null, { status: 500 });
        }

        const sessionService = new SessionService(event.platform!.env.DB);
        const sessionToken = sessionService.generateSessionToken();
        const session = await sessionService.createSession(sessionToken, user.id);
        SessionService.setSessionTokenCookie(event, sessionToken, session.expires_at);
    
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

        console.error("Error during Discord OAuth callback:", e);

        return new Response(null, {
            status: 400
        })
    }
    


}