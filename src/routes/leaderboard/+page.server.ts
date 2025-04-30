import type { Match } from "$lib/models/match";
import type { ROFL, RoflMetadata, RoflPlayerStats } from "$lib/models/rofl";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ platform }) => {
    return {
        leaderboard: await getLeaderboard(platform!)
    }
};

export type LeaderboardPlayer = {
    id: string;
    name: string;
    rank: number;
    wins: number;
    losses: number;
    matchResults: string[];
    positions: LeaderboardPositionResult[];
    positionStats: LeaderboardPositionStats[];
    champions: Record<string, LeaderboardChampionStats>;
    topChampions: LeaderboardChampionStats[];
    winRate?: number;
    streak?: string;
}

export type LeaderboardChampionStats = {
    name: string;
    games: number;
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    assists: number;
    kda: number;
    creepScore: number;
    creepScorePerMinute: number;
    minutesPlayed: number;
}

export type LeaderboardPositionResult = {
    name: string;
    win: boolean;
}

export type LeaderboardPositionStats = {
    name: string;
    wins: number;
    losses: number;
    winRate: number;
}

async function getLeaderboard(platform: Readonly<App.Platform>): Promise<LeaderboardPlayer[]> {
    const query = `
      SELECT * FROM matches
      ORDER BY match_date DESC;
  `;
    const result = await platform.env.DB.prepare(query).all<Match>();

    const matches: Match[] = result.results.map((m: Match) => ({
        ...m,
        data: JSON.parse(m.data as any) as ROFL,
    })).sort((a, b) => {
        try {
            // Attempt to parse match_id as a number for sorting
            const a_matchid = parseInt(a.match_id.split('_')[1]);
            const b_matchid = parseInt(b.match_id.split('_')[1]);

            return b_matchid - a_matchid;
        }
        catch (error) {
            // Sort to end
            return 1
        }
    });

    const players = new Map<string, LeaderboardPlayer>();

    console.log(matches);

    matches.forEach(match => {
        match.data.metadata.statsJson.forEach((player: RoflPlayerStats, index: number) => {
            const playerid = player.PUUID;
            if (!players.has(playerid)) {
                players.set(playerid, {
                    id: playerid,
                    rank: -1,
                    name: player.RIOT_ID_GAME_NAME,
                    wins: 0,
                    losses: 0,
                    matchResults: [],
                    champions: {},
                    positions: [],
                    topChampions: [],
                    positionStats: []
                });
            }

            const existingPlayer = players.get(playerid)!;
            existingPlayer.wins += player.WIN === "Win" ? 1 : 0;
            existingPlayer.losses += player.WIN === "Win" ? 0 : 1;
            existingPlayer.matchResults.push(player.WIN === "Win" ? "W" : "L");
            existingPlayer.positions.push({
                name: player.TEAM_POSITION,
                win: player.WIN === "Win"
            });
            updateChampionStats(existingPlayer, player, match.data.metadata.gameLength);
        })
    });

    const playersArray: LeaderboardPlayer[] = Array.from(players.values()).sort((a, b) => {
        return b.wins - a.wins || (a.losses - b.losses);
    }).map((player, index) => ({
        ...player,
        rank: index + 1,
        winRate: getWinRate(player),
        streak: getWinOrLossStreak(player),
        champions: averageChampionStats(player.champions)
    }));

    playersArray.forEach(player => {
        player.topChampions = getTopPlayerChampions(player, 3);
        player.positionStats = calculatePositionStats(player.positions);
    });


    return playersArray || [];
}

function getWinRate(player: LeaderboardPlayer): number {
    return (player.wins / (player.wins + player.losses)) * 100;
}   

function getWinOrLossStreak(player: LeaderboardPlayer): string {
    let streak = 0;
    let lastResult = player.matchResults[player.matchResults.length - 1];
    for (let i = player.matchResults.length - 1; i >= 0; i--) {
        if (player.matchResults[i] === lastResult) {
            streak++;
        } else {
            break;
        }
    }
    return `${lastResult}${streak}`;
}

function updateChampionStats(player: LeaderboardPlayer, playerStats: RoflPlayerStats, matchDuration: number) {
    const champion = playerStats.SKIN;
    if (!player.champions[champion]) {
        player.champions[champion] = {
            name: champion,
            games: 0,
            wins: 0,
            losses: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
            creepScore: 0,
            creepScorePerMinute: 0,
            kda: 0,
            minutesPlayed: 0
        };
    }

    player.champions[champion].games++;
    player.champions[champion].wins += playerStats.WIN === "Win" ? 1 : 0;
    player.champions[champion].losses += playerStats.WIN === "Win" ? 0 : 1;
    player.champions[champion].kills += Number(playerStats.CHAMPIONS_KILLED);
    player.champions[champion].deaths += Number(playerStats.NUM_DEATHS);
    player.champions[champion].assists += Number(playerStats.ASSISTS);
    player.champions[champion].creepScore += Number(playerStats.MINIONS_KILLED);
    player.champions[champion].minutesPlayed += matchDuration / 1000 / 60;
}

function averageChampionStats(champions: Record<string, LeaderboardChampionStats>): Record<string, LeaderboardChampionStats> {
    // Update champion stats
    let updated: Record<string, LeaderboardChampionStats> = {};

    Object.values(champions).forEach(champion => {
        updated[champion.name] = {
            ...champion,
            creepScore: Math.round(champion.creepScore / champion.games),
            creepScorePerMinute: roundUi(champion.creepScore / champion.minutesPlayed),
            kills: roundUi(champion.kills / champion.games),
            deaths: roundUi(champion.deaths / champion.games), 
            assists: roundUi(champion.assists / champion.games),
            kda: roundUi((champion.kills + champion.assists) / champion.deaths)
        }
    });

    return updated;
}

function getTopPlayerChampions(player: LeaderboardPlayer, top: number): LeaderboardChampionStats[] {
    return Object.values(player.champions).sort((a, b) => {
        return b.games - a.games;
    }).slice(0, top);
}

function calculatePositionStats(positions: LeaderboardPositionResult[]): LeaderboardPositionStats[] {
    const positionStats: LeaderboardPositionStats[] = [];

    positions.forEach(position => {
        positionStats.push({
            name: position.name,
            wins: 0,
            losses: 0,
            winRate: 0
        });
    });

    positionStats.forEach(position => {
        positions.forEach(positionResult => {
            if (positionResult.name === position.name) {
                position.wins++;
            }
        });
    });

    positionStats.forEach(position => {
        position.winRate = roundUi(position.wins / (position.wins + position.losses));
    });

    return positionStats;
}

function roundUi(value: number): number {
    return Math.round(value * 10) / 10;
}