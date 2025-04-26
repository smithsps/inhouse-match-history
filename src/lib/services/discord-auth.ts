import { Discord } from "arctic";
import { env } from "$env/dynamic/private";
import { dev } from "$app/environment";

export const discord = new Discord(
    env.DISCORD_CLIENT_ID,
    env.DISCORD_CLIENT_SECRET,
    dev ? "http://localhost:5173/login/discord/callback" : "https://inhouses.smnth.net/login/discord/callback",
);