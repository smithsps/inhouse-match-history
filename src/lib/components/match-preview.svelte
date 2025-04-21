<script lang="ts">
    import type { Rolf1PlayerStats } from '$lib/models/rofl';
    import type { Rofl2Metadata, Rofl2PlayerStats } from '$lib/models/rofl2';
    import type { ROFL } from '$lib/services/parseRofl';
    import { onMount } from 'svelte';

    let {matchInfo} = $props();

    let match: Rofl2Metadata = $derived(matchInfo.metadata);

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
        const minutes = Math.floor(match.gameLength / 1000 / 60);
        const seconds = Math.floor(match.gameLength / 1000) % 60;
        return `${minutes}m ${seconds}s`;
    });

    const getMatchWinner = (team: string) => {
        return match.statsJson.some(player => player.TEAM === team && player.WIN === "Win");
    };

    const formatGold = (gold: string) => {
        const g = parseInt(gold) 
        return g > 1000 ? `${(g / 1000).toFixed(1)}k` : g.toString();
    };

    const formatCs = (player: Rofl2PlayerStats) => {
        const minions = parseInt(player.MINIONS_KILLED);
        const jungle = parseInt(player.NEUTRAL_MINIONS_KILLED);
        return minions + jungle;
    };
</script>

<div class="p-4 bg-gray-100 rounded-lg shadow-md">
    <div class="grid grid-cols-2 gap-0">
        <!-- Blue Team -->
        <div class="bg-blue-50 p-2 rounded-md shadow-sm">
            <table class="table-auto w-full text-xs text-left">
                <thead>
                    <tr class="bg-blue-200 text-gray-700 font-semibold">
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
                    {#each match.statsJson.filter(player => player.TEAM === "100" && player.TEAM_POSITION === position) as player}
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
                                        style="width: {Math.round((player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS / Math.max(...match.statsJson.map(p => p.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS))) * 100)}%;"
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
                    <tr class="bg-red-200 text-gray-700 font-semibold">
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
                    {#each match.statsJson.filter(player => player.TEAM === "200" && player.TEAM_POSITION === position) as player}
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
                                        style="width: {Math.round((player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS / Math.max(...match.statsJson.map(p => p.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS))) * 100)}%;"
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
    </div>
</div>