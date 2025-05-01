<script lang="ts">
    import type { ROFL, RoflMetadata, RoflPlayerStats } from '$lib/models/rofl';
    import type { DdragongRepository } from '$lib/services/ddragon';

    let {matchInfo, slug, ddragon} = $props<{
        matchInfo: ROFL;
        slug: string | null;
        ddragon: DdragongRepository;
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

    const calculateDamagePercentage = (player: RoflPlayerStats) => {
        const damage = parseInt(player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS);
        const max = Math.max(...match.statsJson.map(p => parseInt(p.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS)));

        return Math.round((damage / max) * 100)
    };

    const teams = $derived.by(() => {
        const blueTeam = { id: "100", bgColor: "blue", textColor: "blue" };
        const redTeam = { id: "200", bgColor: "red", textColor: "red" };

        return isMatchWinner(blueTeam.id) ? [blueTeam, redTeam] : [redTeam, blueTeam];
    });
</script>

<div class="grid grid-cols-2 gap-0">
    {#each teams as team}
        <div class="bg-{team.bgColor}-50 p-2 rounded-md shadow-sm">
            <table class="table-auto w-full text-xs text-left">
                <thead>
                    <tr 
                        class="bg-{team.bgColor}-200 text-gray-700 font-semibold cursor-pointer"
                        onclick={() => window.location.href = `/match/${slug}`}
                    >
                        <th colspan="6" class="px-2 py-1">
                            {isMatchWinner(team.id) ? 'Victory' : 'Defeat'} | {gameLengthFormatted}
                        </th>
                    </tr>
                    <tr class="bg-{team.bgColor}-100 text-gray-500 font-medium">
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
                    {#each match.statsJson.filter(player => player.TEAM === team.id && player.TEAM_POSITION === position) as player}
                        <tr class="border-b">
                            <td class="px-2 py-1 flex items-center">
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
                                    <span class="font-medium text-gray-700 truncate">{player.RIOT_ID_GAME_NAME || player.NAME}</span>
                                </div>
                            </td>
                            <td class="px-2 py-1 text-gray-600">{player.CHAMPIONS_KILLED}/{player.NUM_DEATHS}/{player.ASSISTS}</td>
                            <td class="px-2 py-1 text-gray-600">{formatGold(player.GOLD_EARNED)}</td>
                            <td class="px-2 py-1 text-gray-600">
                                {player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS}
                                <div class="relative w-full h-1 bg-gray-200 rounded mt-1">
                                    <div
                                        class="absolute top-0 left-0 h-full bg-{team.bgColor}-500 rounded"
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
    {/each}
</div>