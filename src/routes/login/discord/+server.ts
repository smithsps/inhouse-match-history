import { generateState, generateCodeVerifier } from "arctic";
import { discord } from "$lib/services/discord-auth";

import type { RequestEvent } from "@sveltejs/kit";

export async function GET(event: RequestEvent): Promise<Response> {
    const state = generateState();
    const scopes = ["identify", "email"];
    const url = discord.createAuthorizationURL(state, null, scopes);

    return new Response (null, {
        status: 302,
        headers: {
            Location: url.toString(),
        }
    })

}