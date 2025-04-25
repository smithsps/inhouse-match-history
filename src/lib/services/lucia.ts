import { Discord } from "arctic";
import { env } from "$env/dynamic/private";
import { dev } from "$app/environment";

export const discord = new Discord(
    env.DISCORD_CLIENT_ID,
    env.DISCORD_CLIENT_SECRET,
    "https://discord.com/oauth2/authorize?client_id=1364424392997736499&response_type=code&redirect_uri=https%3A%2F%2Finhouse.smnth.net%2Flogin%2Fdiscord%2Fcallback&scope=identify+email",
);

