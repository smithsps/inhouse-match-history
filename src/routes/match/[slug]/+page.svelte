<script lang="ts">
    import type { RoflMetadata, RoflPlayerStats } from '$lib/models/rofl.js';
    import type { ROFL } from '$lib/services/parseRofl';
    import { onMount } from 'svelte';

    let { data } = $props();
    let user = $derived(data.user);

    const storedMatch = $derived(data.match);
    const match = $derived(storedMatch.data as ROFL);
    let metadata: RoflMetadata = $derived(match.metadata as RoflMetadata);

    let championImages: Record<string, string> = $state({});
    let summonerSpellImages: Record<string, string> = $state({});

    // Fetch champion and summoner spell data from Data Dragon API
    onMount(async () => {
        const versionResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await versionResponse.json();
        const latestVersion = versions[0];

        // Fetch champion data
        const championsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
        const championsData = await championsResponse.json();
        championImages = Object.fromEntries(
            Object.entries(championsData.data).map(([key, value]: [string, any]) => [
                value.id.toLowerCase(),
                `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${value.image.full}`
            ])
        );

        // Fetch summoner spell data
        const spellsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/summoner.json`);
        const spellsData = await spellsResponse.json();
        summonerSpellImages = Object.fromEntries(
            Object.entries(spellsData.data).map(([key, value]: [string, any]) => [
                value.key,
                `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${value.image.full}`
            ])
        );
    });

    // Helper functions
    const getChampionImage = (championId: string) => championImages[championId.toLowerCase()] || '';
    const getSummonerSpellImage = (spellId: string) => summonerSpellImages[spellId] || '';

    const getGameLength = (gameLength: number) => {
        const minutes = Math.floor(gameLength / 1000 / 60);
        const seconds = Math.floor(gameLength / 1000) % 60;
        return `${minutes}m ${seconds}s`;
    };

    const gameLengthFormatted = $derived.by(() => {
        const minutes = Math.floor(metadata.gameLength / 1000 / 60);
        const seconds = Math.floor(metadata.gameLength / 1000) % 60;
        return `${minutes}m ${seconds}s`;
    });

    const getMatchWinner = (team: string) => {
        return metadata.statsJson.some(player => player.TEAM === team && player.WIN === "Win");
    };

    const formatGold = (gold: string) => {
        const g = parseInt(gold) 
        return g > 1000 ? `${(g / 1000).toFixed(1)}k` : g.toString();
    };

    const formatCs = (player: RoflPlayerStats) => {
        const minions = parseInt(player.MINIONS_KILLED);
        const jungle = parseInt(player.NEUTRAL_MINIONS_KILLED);
        return minions + jungle;
    };

    const calculateDamagePercentage = (player: RoflPlayerStats) => {
        const damage = parseInt(player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS);
        const max = Math.max(...metadata.statsJson.map(p => parseInt(p.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS)));

        return Math.round((damage / max) * 100)
    };
</script>

<div>
    <div class="text-sm text-gray-500 mb-2">
        <div class="flex items-center space-x-4 text-gray-700 ml-2">
            <div class="text-xs font-medium text-gray-500">{new Date(match.date).toLocaleDateString()}</div>
            <div class="text-xs text-gray-500">{new Date(match.date).toLocaleTimeString()}</div>
            <div class="text-xs text-gray-500">{storedMatch.match_id}</div>
            <div class="text-xs text-gray-500">{match.gameVersion}</div>
            <div class="ml-auto"></div>
            {#if user?.is_admin}
            <button
                class="text-xs text-red-500 hover:underline border border-red-500 rounded px-2 py-1 cursor-pointer"
                onclick={() => {
                    if (confirm('Are you sure you want to delete this match?')) {
                        window.location.href = `/match/${storedMatch.file_hash}/delete`;
                    }
                }}
            >
                Delete Match
            </button>
            {/if}

            <a
                class="text-xs text-blue-500 hover:underline ml-1 border border-blue-500 rounded px-2 py-1 cursor-pointer"
                href="/match/{storedMatch.file_hash}/download"
                target="_blank"
            >
                Download Replay File
            </a>
        </div>
    </div>
</div>

/**
{"blueName":"IHQ Blue: 80e5f1e6","redName":"IHQ Red: 80e5f1e6","disabledTurns":[],"disabledChamps":[],"timePerPick":"30","timePerBan":"30","bluePicks":["Chogath","Kayn","Caitlyn","Nautilus","Anivia"],"redPicks":["Yorick","Thresh","Azir","Smolder","Ahri"],"blueBans":["Bard","Hwei","Ekko","Sivir","Urgot"],"redBans":["Leona","Sejuani","Xerath","Milio","Blitzcrank"],"nextTeam":"none","nextType":"none","nextTimeout":0,"blueReady":true,"redReady":true,"state":"finished","turn":20}
**/


<div class="grid grid-cols-2 gap-0">
    <!-- Blue Team -->
    <div class="bg-blue-50 p-2 rounded-md shadow-sm">
        <table class="table-auto w-full text-xs text-left">
            <thead>
                <tr 
                    class="bg-blue-200 text-gray-700 font-semibold cursor-pointer"
                    onclick={() => window.location.href = `/match/${slug}`}
                >
                    <th colspan="6" class="px-2 py-1">
                        {getMatchWinner("100") ? 'Victory' : 'Defeat'} | {gameLengthFormatted}
                    </th>
                </tr>
                <tr class="bg-blue-100 text-gray-500 font-medium">
                    <th class="px-2 py-1">Player</th>
                    <th class="px-2 py-1">K/D/A</th>
                    <th class="px-2 py-1">Gold</th>
                    <th class="px-2 py-1">Damage</th>
                    <th class="px-2 py-1">Wards</th>
                    <th class="px-2 py-1">CS</th>
                </tr>
            </thead>
            <tbody>
                {#each ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as position}
                {#each metadata.statsJson.filter(player => player.TEAM === "100" && player.TEAM_POSITION === position) as player}
                    <tr class="border-b">
                        <td class="px-2 py-1 flex items-center">
                            <img
                                class="w-6 h-6 rounded-sm mr-2"
                                src={getChampionImage(player.SKIN)}
                                alt="{player.SKIN}"
                            />
                            <div class="flex items-center">
                                <img
                                    class="w-5 h-5"
                                    style="margin-bottom: 1px;"
                                    src={getSummonerSpellImage(player.SUMMONER_SPELL_1)}
                                    alt="Summoner Spell 1"
                                />
                                <img
                                    class="w-5 h-5 mr-2"
                                    src={getSummonerSpellImage(player.SUMMONER_SPELL_2)}
                                    alt="Summoner Spell 2"
                                />
                                <span class="font-medium text-gray-700 truncate">{player.RIOT_ID_GAME_NAME || player.NAME}</span>
                            </div>
                        </td>
                        <td class="px-2 py-1 text-gray-600">{player.CHAMPIONS_KILLED}/{player.NUM_DEATHS}/{player.ASSISTS}</td>
                        <td class="px-2 py-1 text-gray-600">{formatGold(player.GOLD_EARNED)}</td>
                        <td class="px-2 py-1 text-gray-600">
                            {player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS}
                            <div class="relative w-full h-1 bg-gray-200 rounded mt-1">
                                <div
                                    class="absolute top-0 left-0 h-full bg-blue-500 rounded"
                                    style="width: {calculateDamagePercentage(player)}%;"
                                ></div>
                            </div>
                        </td>
                        <td class="px-2 py-1 text-gray-600">{player.WARD_PLACED} / {player.WARD_KILLED} / {player.VISION_WARDS_BOUGHT_IN_GAME}</td>
                        <td class="px-2 py-1 text-gray-600">{formatCs(player)}</td>
                    </tr>
                {/each}
                {/each}
            </tbody>
        </table>
    </div>

    <!-- Red Team -->
    <div class="bg-red-50 p-2 rounded-md shadow-sm">
        <table class="table-auto w-full text-xs text-left">
            <thead>
                <tr class="bg-red-200 text-gray-700 font-semibold cursor-pointer"
                    onclick={() => window.location.href = `/match/${slug}`}
                >
                    <th colspan="6" class="px-2 py-1">
                        {getMatchWinner("200") ? 'Victory' : 'Defeat'} | {gameLengthFormatted}
                    </th>
                </tr>
                <tr class="bg-red-100 text-gray-500 font-medium">
                    <th class="px-2 py-1">Player</th>
                    <th class="px-2 py-1">K/D/A</th>
                    <th class="px-2 py-1">Gold</th>
                    <th class="px-2 py-1">Damage</th>
                    <th class="px-2 py-1">Wards</th>
                    <th class="px-2 py-1">CS</th>
                </tr>
            </thead>
            <tbody>
                {#each ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as position}
                {#each metadata.statsJson.filter(player => player.TEAM === "200" && player.TEAM_POSITION === position) as player}
                    <tr class="border-b">
                        <td class="px-2 py-1 flex items-center">
                            <img
                                class="w-6 h-6 rounded-sm mr-2"
                                src={getChampionImage(player.SKIN)}
                                alt="{player.SKIN}"
                            />
                            <div class="flex items-center">
                                <img
                                    class="w-5 h-5"
                                    style="margin-bottom: 1px;"
                                    src={getSummonerSpellImage(player.SUMMONER_SPELL_1)}
                                    alt="Summoner Spell 1"
                                />
                                <img
                                    class="w-5 h-5 mr-2"
                                    src={getSummonerSpellImage(player.SUMMONER_SPELL_2)}
                                    alt="Summoner Spell 2"
                                />
                                <span class="font-medium text-gray-700 truncate">{player.RIOT_ID_GAME_NAME || player.NAME}</span>
                            </div>
                        </td>
                        <td class="px-2 py-1 text-gray-600">{player.CHAMPIONS_KILLED}/{player.NUM_DEATHS}/{player.ASSISTS}</td>
                        <td class="px-2 py-1 text-gray-600">{formatGold(player.GOLD_EARNED)}</td>
                        <td class="px-2 py-1 text-gray-600">
                            {player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS}
                            <div class="relative w-full h-1 bg-gray-200 rounded mt-1">
                                <div
                                    class="absolute top-0 left-0 h-full bg-red-500 rounded"
                                    style="width: {calculateDamagePercentage(player)}%;"
                                ></div>
                            </div>
                        </td>
                        <td class="px-2 py-1 text-gray-600">{player.WARD_PLACED} / {player.WARD_KILLED} / {player.VISION_WARDS_BOUGHT_IN_GAME}</td>
                        <td class="px-2 py-1 text-gray-600">{formatCs(player)}</td>
                    </tr>
                {/each}
                {/each}
            </tbody>
        </table>
    </div>

    <div class="col-span-2 mt-8">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Detailed Player Stats</h2>
        <div class="grid grid-cols-2 gap-6">
            {#each ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as position}
            {#each ["100", "200"] as team}
            {#each metadata.statsJson.filter(player => player.TEAM_POSITION === position && player.TEAM == team) as player}
            <div class="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div class="flex items-center mb-4">
                    <img
                        class="w-12 h-12 rounded-full mr-4"
                        src={getChampionImage(player.SKIN)}
                        alt="{player.SKIN}"
                    />
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">{player.RIOT_ID_GAME_NAME || player.NAME}</h3>
                        <p class="text-sm text-gray-500">{player.TEAM_POSITION}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                        <p><strong>K/D/A:</strong> {player.CHAMPIONS_KILLED}/{player.NUM_DEATHS}/{player.ASSISTS}</p>
                        <p><strong>Gold Earned:</strong> {formatGold(player.GOLD_EARNED)}</p>
                        <p><strong>CS:</strong> {formatCs(player)}</p>
                        <p><strong>Kill Participation:</strong> 
                            {Math.round(((parseInt(player.CHAMPIONS_KILLED) + parseInt(player.ASSISTS)) / metadata.statsJson.reduce((acc, p) => acc + parseInt(p.CHAMPIONS_KILLED), 0)) * 100)}%
                        </p>
                    </div>
                    <div>
                        <p><strong>Damage Dealt:</strong> {player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS}</p>
                        <div class="relative w-full h-2 bg-gray-200 rounded mt-1">
                            <div
                                class="absolute top-0 left-0 h-full bg-blue-500 rounded"
                                style="width: {calculateDamagePercentage(player)}%;"
                            ></div>
                        </div>
                        <p class="mt-2"><strong>Damage Taken:</strong> {player.TOTAL_DAMAGE_TAKEN}</p>
                        <p><strong>Healing Done:</strong> {player.TOTAL_HEAL}</p>
                    </div>
                </div>
                <div class="mt-4">
                    <h4 class="text-sm font-semibold text-gray-800 mb-2">Objective Stats</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <p><strong>Objective Damage:</strong> {player.TOTAL_DAMAGE_DEALT_TO_OBJECTIVES}</p>
                        <p><strong>Turret Damage:</strong> {player.TOTAL_DAMAGE_DEALT_TO_TURRETS}</p>
                        <p><strong>Wards Placed:</strong> {player.WARD_PLACED}</p>
                        <p><strong>Wards Killed:</strong> {player.WARD_KILLED}</p>
                        <p><strong>Vision Wards Bought:</strong> {player.VISION_WARDS_BOUGHT_IN_GAME}</p>
                        <p><strong>Time Spent Dead:</strong> {Math.floor(parseInt(player.TOTAL_TIME_SPENT_DEAD) / 60)}m {parseInt(player.TOTAL_TIME_SPENT_DEAD) % 60}s</p>
                    </div>
                </div>
            </div>
            {/each}
            {/each}
            {/each}
        </div>
    </div>
</div>