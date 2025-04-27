import type { ROFL } from "$lib/services/parseRofl";
import type { Match } from "../proxy+page.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform }) => {
    return {
        leaderboard: await getLeaderboard(platform!)
    }
};

export type LeaderboardPlayer = {
    id: string;
    name: string;
    champions: string[];
    wins: number;
    losses: number;
}

async function getLeaderboard(platform: Readonly<App.Platform>): Promise<LeaderboardPlayer[]> {
    const query = `
      SELECT * FROM matches
      ORDER BY match_date DESC;
  `;
    const result = await platform.env.DB.prepare(query).all<Match>();

    const matches = result.results.map((m: Match) => ({
        ...m,
        data: JSON.parse(m.data as any) as ROFL,
    }));

    const players = new Map<string, LeaderboardPlayer>();

    matches.forEach(match => {
        match.data.metadata.statsJson.forEach((player) => {
            const playerid = player.PUUID;
            if (!players.has(playerid)) {
                players.set(playerid, {
                    id: playerid,
                    name: player.RIOT_ID_GAME_NAME,
                    champions: [],
                    wins: player.WIN === "Win" ? 1 : 0,
                    losses: player.WIN === "Win" ? 0 : 1
                });
            } else {
                const existingPlayer = players.get(playerid)!;
                existingPlayer.wins += player.WIN === "Win" ? 1 : 0;
                existingPlayer.losses += player.WIN === "Win" ? 0 : 1;
            }

        })
    });

    const playersArray = Array.from(players.values()).sort((a, b) => {
        return b.wins - a.wins || (a.losses - b.losses);
    });


    return playersArray || [];
}