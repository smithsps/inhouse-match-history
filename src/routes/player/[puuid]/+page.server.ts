import type { PageServerLoad } from './$types';
import { PlayerService } from '$lib/services/player';
import type { Match } from '$lib/models/match';
import type { ROFL, RoflPlayerStats } from '$lib/models/rofl';

export type PlayerStats = {
    name: string;
    rank: {
        position: number;
        total: number;
    };
    stats: {
        totalGames: number;
        wins: number;
        losses: number;
        champions: Record<string, ChampionStats>;
        positions: Record<string, VillianStats>;
        synergies: Record<string, SynergyStats>;
        villains: Record<string, VillianStats>;
    };
    matches: MatchResult[];
}

export type ChampionStats = {
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

export type VillianStats = {
    games: number;
    wins: number;
    losses: number;
    name: string;
}

export type SynergyStats = {
    games: number;
    wins: number;
    losses: number;
    name: string;
}

export type MatchResult = {
    matchId: string;
    fileHash: string;
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
    items: number[];
    teams?: {
        name: string;
        puuid: string;
        champion: string;
    }[][];
}

export const load: PageServerLoad = async ({ params, platform }) => {
    const result = await platform!.env.DB.prepare("SELECT * FROM matches").all<Match>();
    const matches: Match[] = result.results.map((m: Match) => ({
        ...m,
        data: JSON.parse(m.data as any) as ROFL,
    })).sort((a, b) => {
        return parseInt(b.match_id.split('_')[1]) - parseInt(a.match_id.split('_')[1]);
    });

    const playerStats: PlayerStats = {
        name: '',
        rank: {
            position: 0,
            total: 0
        },
        stats: {
            totalGames: 0,
            wins: 0,
            losses: 0,
            champions: {},
            positions: {},
            synergies: {},
            villains: {}
        },
        matches: []
    };

    // Process matches to build player stats
    matches.forEach(match => {
        const playerIndex = match.data.metadata.statsJson.findIndex((p: RoflPlayerStats) => 
            PlayerService.getPlayerPuuid(p.PUUID) === params.puuid
        );

        if (playerIndex === -1) return;

        const player = match.data.metadata.statsJson[playerIndex];
        const isWin = player.WIN === "Win";

        // Update basic stats
        playerStats.stats.totalGames++;
        playerStats.stats.wins += isWin ? 1 : 0;
        playerStats.stats.losses += isWin ? 0 : 1;

        // Set player name if not set
        if (!playerStats.name) {
            playerStats.name = PlayerService.getPlayerNameOrDefault(player.PUUID, player.RIOT_ID_GAME_NAME || player.NAME);
        }

        // Update champion stats
        const champion = player.SKIN;
        if (!playerStats.stats.champions[champion]) {
            playerStats.stats.champions[champion] = {
                games: 0,
                wins: 0,
                losses: 0,
                kills: 0,
                deaths: 0,
                assists: 0,
                kda: 0,
                creepScore: 0,
                creepScorePerMinute: 0,
                minutesPlayed: 0
            };
        }
        const championStats = playerStats.stats.champions[champion];
        championStats.games++;
        championStats.wins += isWin ? 1 : 0;
        championStats.losses += isWin ? 0 : 1;
        championStats.kills += Number(player.CHAMPIONS_KILLED);
        championStats.deaths += Number(player.NUM_DEATHS);
        championStats.assists += Number(player.ASSISTS);
        championStats.creepScore += Number(player.MINIONS_KILLED) + Number(player.NEUTRAL_MINIONS_KILLED);
        championStats.minutesPlayed += match.data.metadata.gameLength / 1000 / 60;
        championStats.creepScorePerMinute = championStats.creepScore / championStats.minutesPlayed;
        championStats.kda = championStats.deaths === 0 ? 
            championStats.kills + championStats.assists : 
            (championStats.kills + championStats.assists) / championStats.deaths;

        // Update position stats
        const position = player.TEAM_POSITION;
        if (!playerStats.stats.positions[position]) {
            playerStats.stats.positions[position] = {
                games: 0,
                wins: 0,
                losses: 0,
                name: ""
            };
        }
        const positionStats = playerStats.stats.positions[position];
        positionStats.games++;
        positionStats.wins += isWin ? 1 : 0;
        positionStats.losses += isWin ? 0 : 1;

        // Update synergy stats
        match.data.metadata.statsJson.forEach((teammate: RoflPlayerStats, index: number) => {
            if (index === playerIndex) return;
            if (teammate.TEAM === player.TEAM) {
                const teammateId = PlayerService.getPlayerPuuid(teammate.PUUID);
                if (!playerStats.stats.synergies[teammateId]) {
                    playerStats.stats.synergies[teammateId] = {
                        games: 0,
                        wins: 0,
                        losses: 0,
                        name: PlayerService.getPlayerNameOrDefault(teammate.PUUID, teammate.RIOT_ID_GAME_NAME || teammate.NAME)
                    };
                }
                const synergyStats = playerStats.stats.synergies[teammateId];
                synergyStats.games++;
                synergyStats.wins += isWin ? 1 : 0;
                synergyStats.losses += isWin ? 0 : 1;
            }
        });

        // Update villain stats
        match.data.metadata.statsJson.forEach((opponent: RoflPlayerStats, index: number) => {
            if (index === playerIndex) return;
            if (opponent.TEAM !== player.TEAM) {
                const opponentId = PlayerService.getPlayerPuuid(opponent.PUUID);
                if (!playerStats.stats.villains[opponentId]) {
                    playerStats.stats.villains[opponentId] = {
                        games: 0,
                        wins: 0,
                        losses: 0,
                        name: PlayerService.getPlayerNameOrDefault(opponent.PUUID, opponent.RIOT_ID_GAME_NAME || opponent.NAME)
                    };
                }
                const villainStats = playerStats.stats.villains[opponentId];
                villainStats.games++;
                villainStats.wins += isWin ? 1 : 0;
                villainStats.losses += isWin ? 0 : 1;
            }
        });

        // Add match result
        playerStats.matches.push({
            matchId: match.match_id,
            fileHash: match.file_hash,
            win: isWin,
            champion: champion,
            kills: Number(player.CHAMPIONS_KILLED),
            deaths: Number(player.NUM_DEATHS),
            assists: Number(player.ASSISTS),
            creepScore: Number(player.MINIONS_KILLED) + Number(player.NEUTRAL_MINIONS_KILLED),
            creepScorePerMinute: (Number(player.MINIONS_KILLED) + Number(player.NEUTRAL_MINIONS_KILLED)) / (match.data.metadata.gameLength / 1000 / 60),
            goldEarned: Number(player.GOLD_EARNED),
            damageDealt: Number(player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS),
            damageTaken: Number(player.TOTAL_DAMAGE_TAKEN),
            gameLength: match.data.metadata.gameLength,
            date: match.match_date,
            position: position,
            items: [
                player.ITEM0,
                player.ITEM1,
                player.ITEM2,
                player.ITEM3,
                player.ITEM4,
                player.ITEM5,
                player.ITEM6
            ],
            teams: (() => {
                // Map with TEAM
                const mapped = match.data.metadata.statsJson.map((p: RoflPlayerStats) => ({
                    name: PlayerService.getPlayerNameOrDefault(p.PUUID, p.RIOT_ID_GAME_NAME || p.NAME),
                    puuid: PlayerService.getPlayerPuuid(p.PUUID),
                    champion: p.SKIN,
                    TEAM: p.TEAM
                })) as Array<{ name: string; puuid: string; champion: string; TEAM: any }>;
                // Find unique teams (should be 2)
                const uniqueTeams = Array.from(new Set(mapped.map((p: { TEAM: any }) => p.TEAM)));
                // Split into two arrays by team
                return uniqueTeams.map((team: any) =>
                    mapped
                        .filter((p: { TEAM: any }) => p.TEAM === team)
                        .map(({TEAM, ...rest}: {TEAM: any, name: string, puuid: string, champion: string}) => rest as { name: string; puuid: string; champion: string })
                );
            })()
        });
    });

    // Calculate rank
    const allPlayers = new Map<string, { wins: number; losses: number }>();
    matches.forEach(match => {
        match.data.metadata.statsJson.forEach((p: RoflPlayerStats) => {
            const playerId = PlayerService.getPlayerPuuid(p.PUUID);
            if (!allPlayers.has(playerId)) {
                allPlayers.set(playerId, { wins: 0, losses: 0 });
            }
            const stats = allPlayers.get(playerId)!;
            if (p.WIN === "Win") stats.wins++;
            else stats.losses++;
        });
    });

    const sortedPlayers = Array.from(allPlayers.entries())
        .sort((a, b) => {
            const aWinRate = a[1].wins / (a[1].wins + a[1].losses);
            const bWinRate = b[1].wins / (b[1].wins + b[1].losses);
            return bWinRate - aWinRate;
        });

    const playerRank = sortedPlayers.findIndex(([id]) => id === params.puuid) + 1;
    playerStats.rank = {
        position: playerRank,
        total: sortedPlayers.length
    };

    return {
        player: playerStats
    };
}; 