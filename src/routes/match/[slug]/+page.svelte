<script lang="ts">
    import DraftDisplay from '$lib/components/draft-display.svelte';
    import MatchPreview from '$lib/components/match-preview.svelte';
    import type { RoflMetadata, RoflPlayerStats } from '$lib/models/rofl.js';
    import { PlayerService } from '$lib/services/player.js';

    let { data } = $props();
    let user = $derived(data.user);

    const storedMatch = $derived(data.match);
    const match = $derived(storedMatch.data);
    let metadata: RoflMetadata = $derived(match.metadata as RoflMetadata);
    const draft = $derived(storedMatch.draft_data);
    let ddragon = $derived(data.ddragon);

    const getGameLength = (gameLength: number) => {
        const minutes = Math.floor(gameLength / 1000 / 60);
        const seconds = Math.floor(gameLength / 1000) % 60;
        return `${minutes}m ${seconds}s`;
    };

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

    const calculateKillParticipation = (player: RoflPlayerStats) => {
        const playerKills = parseInt(player.CHAMPIONS_KILLED);
        const playerAssists = parseInt(player.ASSISTS);
        const teamKills = metadata.statsJson
            .filter(p => p.TEAM === player.TEAM)
            .reduce((acc, p) => acc + parseInt(p.CHAMPIONS_KILLED), 0);
        
        return Math.round(((playerKills + playerAssists) / teamKills) * 100);
    };
</script>

{#if storedMatch}
<div>
    <div class="text-sm text-gray-500 mb-2">
        <div class="flex items-center space-x-4 text-gray-700 ml-2">
            <div class="text-xs font-medium text-gray-500">{new Date(storedMatch.match_date).toLocaleDateString()}</div>
            <div class="text-xs text-gray-500">{new Date(storedMatch.match_date).toLocaleTimeString()}</div>
            <div class="text-xs text-gray-500">{storedMatch.match_id}</div>
            <div class="text-xs text-gray-500">{match.gameVersion}</div>
            <div class="ml-auto"></div>
            {#if user?.is_admin}
            <button
                class="text-xs text-green-600 hover:underline border border-green-600 rounded px-2 py-1 cursor-pointer"
                onclick={() => {
                    window.location.href = `/match/${storedMatch.file_hash}/edit`;
                }}
            >
                Edit Match
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

<MatchPreview matchInfo={{ version: match.version, filename: match.filename, gameVersion: match.gameVersion, metadata: metadata, date: new Date(storedMatch.match_date), match_id: storedMatch.match_id }} slug={storedMatch.file_hash} ddragon={ddragon} />

{#if storedMatch.draft_data}
    <div class="col-span-2 my-4">
        <DraftDisplay draftState={draft} ddragon={ddragon} />
    </div>
{/if}

<div class="col-span-2 mt-4">
    <div class="grid grid-cols-2 gap-6">
        {#each ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as position}
        {#each ["100", "200"] as team}
        {#each metadata.statsJson.filter(player => player.TEAM_POSITION === position && player.TEAM == team) as player}
        <div class="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
                <img
                    class="w-12 h-12 rounded-full mr-4"
                    src={ddragon.getChampionImage(player.SKIN)}
                    alt="{player.SKIN}"
                />
                <div>
                    <h3 class="text-lg font-semibold text-gray-900">{@html PlayerService.getPlayerNameWithAsterisk(player.PUUID, player.RIOT_ID_GAME_NAME || player.NAME)}</h3>
                    <p class="text-sm text-gray-500">{player.TEAM_POSITION}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                    <p><strong>K/D/A:</strong> {player.CHAMPIONS_KILLED}/{player.NUM_DEATHS}/{player.ASSISTS}</p>
                    <p><strong>Gold Earned:</strong> {formatGold(player.GOLD_EARNED)}</p>
                    <p><strong>CS:</strong> {formatCs(player)}</p>
                    <p><strong>Kill Participation:</strong> {calculateKillParticipation(player)}%</p>
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
{/if}