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
    matchResults: MatchResult[];
    positions: LeaderboardPositionResult[];
    positionStats: LeaderboardPositionStats[];
    champions: Record<string, LeaderboardChampionStats>;
    topChampions: LeaderboardChampionStats[];
    winRate?: number;
    streak?: string;
}

export type MatchResult = {
    matchId: string;
    win: boolean;
    champion: string;
    kills: number;
    deaths: number;
    assists: number;
    creepScore: number;
    creepScorePerMinute: number;
    goldEarned: number;
    damageDealt: number;
    damageTaken: number;
    gameLength: number;
    date: string;
    position: string;
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
    const result = await platform.env.DB.prepare("SELECT * FROM matches").all<Match>();

    const matches: Match[] = result.results.map((m: Match) => ({
        ...m,
        data: JSON.parse(m.data as any) as ROFL,
    })).sort((a, b) => {
        // Sort from highest to lowest match id ex: NA_12434352
        return parseInt(b.match_id.split('_')[1]) - parseInt(a.match_id.split('_')[1]);
    });

    const players = new Map<string, LeaderboardPlayer>();

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
            const isWin = player.WIN === "Win";
            existingPlayer.wins += isWin ? 1 : 0;
            existingPlayer.losses += isWin ? 0 : 1;
            
            existingPlayer.matchResults.push({
                matchId: match.match_id,
                win: isWin,
                champion: player.SKIN,
                kills: Number(player.CHAMPIONS_KILLED),
                deaths: Number(player.NUM_DEATHS),
                assists: Number(player.ASSISTS),
                creepScore: Number(player.MINIONS_KILLED) + Number(player.NEUTRAL_MINIONS_KILLED),
                creepScorePerMinute: roundUi((Number(player.MINIONS_KILLED) + Number(player.NEUTRAL_MINIONS_KILLED)) / (match.data.metadata.gameLength / 1000 / 60)),
                goldEarned: Number(player.GOLD_EARNED),
                damageDealt: Number(player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS),
                damageTaken: Number(player.TOTAL_DAMAGE_TAKEN),
                gameLength: match.data.metadata.gameLength,
                date: match.match_date,
                position: player.TEAM_POSITION
            });
            
            existingPlayer.positions.push({
                name: player.TEAM_POSITION,
                win: isWin
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
    if (player.matchResults.length === 0) return '';
    
    let streak = 0;
    const lastResult = player.matchResults[0].win;
    
    for (const match of player.matchResults) {
        if (match.win === lastResult) {
            streak++;
        } else {
            break;
        }
    }
    
    return `${lastResult ? 'W' : 'L'}${streak}`;
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
    player.champions[champion].creepScore += Number(playerStats.MINIONS_KILLED) + Number(playerStats.NEUTRAL_MINIONS_KILLED);
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
                if (positionResult.win) {
                    position.wins++;
                } else {
                    position.losses++;
                }
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