<script lang="ts">
    import type { ROFL, RoflMetadata, RoflPlayerStats } from '$lib/models/rofl';
    import type { DdragongRepository } from '$lib/services/ddragon';
    import PlayerName from '$lib/components/player-name.svelte';

    let {matchInfo, slug, ddragon, sortByWinner = false, showLink = false} = $props<{
        matchInfo: ROFL;
        slug: string | null;
        ddragon: DdragongRepository;
        sortByWinner?: boolean;
        showLink?: boolean;
    }>();

    let match: RoflMetadata = $derived(matchInfo.metadata);

    const gameLengthFormatted = $derived.by(() => {
        const minutes = Math.floor(match.gameLength / 1000 / 60);
        const seconds = Math.floor(match.gameLength / 1000) % 60;
        return `${minutes}m ${seconds}s`;
    });

    const isMatchWinner = (team: string) => {
        return match.statsJson.some(player => player.TEAM === team && player.WIN === "Win");
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

    const formatCsPerMinute = (player: RoflPlayerStats) => {
        const cs = parseInt(player.MINIONS_KILLED) + parseInt(player.NEUTRAL_MINIONS_KILLED);
        const minutes = match.gameLength / 1000 / 60;
        return Math.round((cs / minutes * 10))/ 10;
    };

    const calculateDamagePercentage = (player: RoflPlayerStats) => {
        const damage = parseInt(player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS);
        const max = Math.max(...match.statsJson.map(p => parseInt(p.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS)));

        return Math.round((damage / max) * 100)
    };

    const teams = $derived.by(() => {
        const blueTeam = { id: "100", bgColor: "bg-blue-50", headerBgColor: "bg-blue-100", titleBgColor: "bg-blue-200", barBgColor: "bg-blue-500" };
        const redTeam = { id: "200", bgColor: "bg-red-50", headerBgColor: "bg-red-100", titleBgColor: "bg-red-200", barBgColor: "bg-red-500" };

        if (!sortByWinner) {
            return [blueTeam, redTeam];
        }
        
        return isMatchWinner(blueTeam.id) ? [blueTeam, redTeam] : [redTeam, blueTeam];
    });
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
    {#each teams as team}
        <div class="{team.bgColor} p-2 rounded-md shadow-sm">
            <div class="w-full text-xs">
                <div class="grid grid-cols-[auto_auto_auto_auto_auto_auto] gap-0 items-center">
                    {#if showLink}
                    <a 
                        class="{team.titleBgColor} text-gray-700 font-semibold px-2 py-1 col-span-6"
                        href={slug ? `/match/${slug}` : ''}
                    >
                        {isMatchWinner(team.id) ? 'Victory' : 'Defeat'} | {gameLengthFormatted}
                    </a>
                    {:else}
                        <div class="{team.titleBgColor} text-gray-700 font-semibold px-2 py-1 col-span-6">
                            {isMatchWinner(team.id) ? 'Victory' : 'Defeat'} | {gameLengthFormatted}
                        </div>
                    {/if}
                    <div class="{team.headerBgColor} text-gray-500 font-medium px-2 py-1">Player</div>
                    <div class="{team.headerBgColor} text-gray-500 font-medium px-2 py-1">KDA</div>
                    <div class="{team.headerBgColor} text-gray-500 font-medium px-2 py-1">Gold</div>
                    <div class="{team.headerBgColor} text-gray-500 font-medium px-2 py-1">Damage</div>
                    <div class="{team.headerBgColor} text-gray-500 font-medium px-2 py-1">Wards</div>
                    <div class="{team.headerBgColor} text-gray-500 font-medium px-2 py-1">CS</div>
                    
                    {#each ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as position}
                        {#each match.statsJson.filter(player => player.TEAM === team.id && player.TEAM_POSITION === position) as player}
                            <div class="px-2 py-1 flex items-center">
                                <img
                                    class="w-6 h-6 rounded-sm mr-2"
                                    src={ddragon.getChampionImage(player.SKIN)}
                                    alt="{player.SKIN}"
                                />
                                <div class="flex items-center">
                                    <img
                                        class="w-5 h-5"
                                        style="margin-bottom: 1px;"
                                        src={ddragon.getSummonerSpellImage(player.SUMMONER_SPELL_1)}
                                        alt="Summoner Spell 1"
                                    />
                                    <img
                                        class="w-5 h-5 mr-2"
                                        src={ddragon.getSummonerSpellImage(player.SUMMONER_SPELL_2)}
                                        alt="Summoner Spell 2"
                                    />
                                    <a href="/player/{player.PUUID}" class="hover:underline">
                                        <PlayerName puuid={player.PUUID} name={player.RIOT_ID_GAME_NAME || player.NAME} />
                                    </a>
                                </div>
                            </div>
                            <div class="px-2 py-1 text-gray-600">{player.CHAMPIONS_KILLED}/{player.NUM_DEATHS}/{player.ASSISTS}</div>
                            <div class="px-2 py-1 text-gray-600">{formatGold(player.GOLD_EARNED)}</div>
                            <div class="px-2 py-1 text-gray-600">
                                {player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS}
                                <div class="relative w-full h-1 bg-gray-200 rounded">
                                    <div
                                        class="absolute top-0 left-0 h-full {team.barBgColor} rounded"
                                        style="width: {calculateDamagePercentage(player)}%;"
                                    ></div>
                                </div>
                            </div>
                            <div class="px-2 py-1 text-gray-600" title="Vision Wards Bought - Wards Placed / Wards Killed">
                                {player.VISION_WARDS_BOUGHT_IN_GAME} <span class="text-gray-400 text-xs"> - </span> {player.WARD_PLACED}/{player.WARD_KILLED}
                            </div>
                            <div class="px-2 py-1 text-gray-600">
                                {formatCs(player)} <span class="text-gray-500 text-xs">({formatCsPerMinute(player)})</span>
                            </div>
                        {/each}
                    {/each}
                </div>
            </div>
        </div>
    {/each}
</div>