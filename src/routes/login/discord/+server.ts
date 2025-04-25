import { generateState, generateCodeVerifier } from "arctic";
import { discord } from "$lib/services/lucia";

import type { RequestEvent } from "@sveltejs/kit";

export async function GET(event: RequestEvent): Promise<Response> {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const scopes = ["identify", "email"];
    const url = discord.createAuthorizationURL(state, codeVerifier, scopes);

    // event.cookies.set("discord_oauth_state", state, {
    //     path: "/",
    //     httpOnly: true,
    //     sameSite: "lax",
    //     maxAge: 60 * 10,
    // });

    return new Response (null, {
        status: 302,
        headers: {
            Location: url.toString(),
        }
    })

}