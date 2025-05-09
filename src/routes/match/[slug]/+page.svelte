<script lang="ts">
    import DraftDisplay from '$lib/components/draft-display.svelte';
    import MatchPreview from '$lib/components/match-preview.svelte';
    import PlayerName from '$lib/components/player-name.svelte';
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

    // Compute max values for bars
    const maxStats = $derived(() => {
        const stats = metadata.statsJson;
        return {
            damageDealt: Math.max(...stats.map(p => parseInt(p.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS) || 0)),
            damageTaken: Math.max(...stats.map(p => parseInt(p.TOTAL_DAMAGE_TAKEN) || 0)),
            healingDone: Math.max(...stats.map(p => parseInt(p.TOTAL_HEAL) || 0)),
            gold: Math.max(...stats.map(p => parseInt(p.GOLD_EARNED) || 0)),
            cs: Math.max(...stats.map(p => parseInt(p.MINIONS_KILLED) + parseInt(p.NEUTRAL_MINIONS_KILLED) || 0)),
            wardsPlaced: Math.max(...stats.map(p => parseInt(p.WARD_PLACED) || 0)),
            wardsKilled: Math.max(...stats.map(p => parseInt(p.WARD_KILLED) || 0)),
            controlWards: Math.max(...stats.map(p => parseInt(p.VISION_WARDS_BOUGHT_IN_GAME) || 0)),
            objDamage: Math.max(...stats.map(p => parseInt(p.TOTAL_DAMAGE_DEALT_TO_OBJECTIVES) || 0)),
            turretDamage: Math.max(...stats.map(p => parseInt(p.TOTAL_DAMAGE_DEALT_TO_TURRETS) || 0)),
            timeDead: Math.max(...stats.map(p => parseInt(p.TOTAL_TIME_SPENT_DEAD) || 0)),
        };
    });

    // Compute max values for team stats for bar scaling
    const teamStatsMax = {
        towers: Math.max(
            ...["100", "200"].map(team => metadata.statsJson.filter(p => p.TEAM === team).reduce((acc, p) => acc + parseInt(p.TURRETS_KILLED), 0))
        ),
        dragons: Math.max(
            ...["100", "200"].map(team => metadata.statsJson.filter(p => p.TEAM === team).reduce((acc, p) => acc + parseInt(p.DRAGON_KILLS), 0))
        ),
        barons: Math.max(
            ...["100", "200"].map(team => metadata.statsJson.filter(p => p.TEAM === team).reduce((acc, p) => acc + parseInt(p.BARON_KILLS), 0))
        ),
        herald: Math.max(
            ...["100", "200"].map(team => metadata.statsJson.filter(p => p.TEAM === team).reduce((acc, p) => acc + parseInt(p.RIFT_HERALD_KILLS), 0))
        ),
        atakhan: Math.max(
            ...["100", "200"].map(team => metadata.statsJson.filter(p => p.TEAM === team).reduce((acc, p) => acc + parseInt(p.ATAKHAN_KILLS), 0))
        ),
        grubs: Math.max(
            ...["100", "200"].map(team => metadata.statsJson.filter(p => p.TEAM === team).reduce((acc, p) => acc + parseInt(p.HORDE_KILLS), 0))
        ),
        gold: Math.max(
            ...["100", "200"].map(team => metadata.statsJson.filter(p => p.TEAM === team).reduce((acc, p) => acc + parseInt(p.GOLD_EARNED), 0))
        ),
        kills: Math.max(
            ...["100", "200"].map(team => metadata.statsJson.filter(p => p.TEAM === team).reduce((acc, p) => acc + parseInt(p.CHAMPIONS_KILLED), 0))
        ),
    };

    // Helper to get team stat value
    function getTeamStat(team: string, key: keyof RoflPlayerStats): number {
        return metadata.statsJson.filter(p => p.TEAM === team).reduce((acc, p) => acc + parseInt((p[key] ?? '0') as string), 0);
    }
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

<!-- Team Statistics Section -->
<div class="col-span-2 mt-4 mb-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each ["100", "200"] as team}
      <div class="bg-white rounded-xl shadow p-6 flex flex-col">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold {team === '100' ? 'text-blue-700' : 'text-red-700'}">
            {team === "100" ? "Blue Team" : "Red Team"}
          </h3>
          <span class="text-sm font-semibold {team === '100' ? 'text-blue-500' : 'text-red-500'}">
            {getMatchWinner(team) ? "Victory" : "Defeat"}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
          {#each [
            { label: 'Towers', key: 'TURRETS_KILLED', max: teamStatsMax.towers },
            { label: 'Dragons', key: 'DRAGON_KILLS', max: teamStatsMax.dragons },
            { label: 'Barons', key: 'BARON_KILLS', max: teamStatsMax.barons },
            { label: 'Rift Herald', key: 'RIFT_HERALD_KILLS', max: teamStatsMax.herald },
            { label: 'Atakhan', key: 'ATAKHAN_KILLS', max: teamStatsMax.atakhan },
            { label: 'Void Grubs', key: 'HORDE_KILLS', max: teamStatsMax.grubs },
          ] as stat}
            <div class="text-sm text-gray-600">{stat.label}</div>
            <div class="flex items-center gap-2">
              <div class="relative flex-1 h-2 bg-gray-200 rounded">
                <div
                  class="absolute top-0 left-0 h-2 rounded"
                  style="width: {stat.max > 0 ? Math.max(8, (getTeamStat(team, stat.key as keyof RoflPlayerStats) / stat.max) * 100) : 0}%; background: {team === '100' ? '#3b82f6' : '#ef4444'}"
                  aria-label="{stat.label} bar"
                  title={getTeamStat(team, stat.key as keyof RoflPlayerStats).toString()}
                ></div>
              </div>
              <div class="text-sm text-gray-900 text-right w-8">{getTeamStat(team, stat.key as keyof RoflPlayerStats)}</div>
            </div>
          {/each}
          <div class="text-sm text-gray-600">Total Gold</div>
          <div class="flex items-center gap-2">
            <div class="relative flex-1 h-2 bg-gray-200 rounded">
              <div
                class="absolute top-0 left-0 h-2 rounded"
                style="width: {teamStatsMax.gold > 0 ? Math.max(8, (getTeamStat(team, 'GOLD_EARNED') / teamStatsMax.gold) * 100) : 0}%; background: {team === '100' ? '#3b82f6' : '#ef4444'}"
                aria-label="Total Gold bar"
                title={formatGold(getTeamStat(team, 'GOLD_EARNED').toString())}
              ></div>
            </div>
            <div class="text-sm text-gray-900 text-right w-12">{formatGold(getTeamStat(team, 'GOLD_EARNED').toString())}</div>
          </div>
          <div class="text-sm text-gray-600">Total Kills</div>
          <div class="flex items-center gap-2">
            <div class="relative flex-1 h-2 bg-gray-200 rounded">
              <div
                class="absolute top-0 left-0 h-2 rounded"
                style="width: {teamStatsMax.kills > 0 ? Math.max(8, (getTeamStat(team, 'CHAMPIONS_KILLED') / teamStatsMax.kills) * 100) : 0}%; background: {team === '100' ? '#3b82f6' : '#ef4444'}"
                aria-label="Total Kills bar"
                title={getTeamStat(team, 'CHAMPIONS_KILLED').toString()}
              ></div>
            </div>
            <div class="text-sm text-gray-900 text-right w-8">{getTeamStat(team, 'CHAMPIONS_KILLED')}</div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<div class="col-span-2 mt-4">
    <div class="grid grid-cols-2 gap-6">
        {#each ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as position}
        {#each ["100", "200"] as team}
        {#each metadata.statsJson.filter(player => player.TEAM_POSITION === position && player.TEAM == team) as player}
        <div class="bg-white rounded-xl shadow p-6 flex flex-col min-w-[320px]">
            <!-- Top Row: Champion, Name, Position, KDA, KP -->
            <div class="flex items-center mb-2 w-full justify-between">
                <div class="flex items-center">
                    <img class="w-10 h-10 rounded-full mr-3" src={ddragon.getChampionImage(player.SKIN)} alt={player.SKIN} />
                    <div>
                        <PlayerName puuid={player.PUUID} name={player.RIOT_ID_GAME_NAME || player.NAME} />
                        <div class="text-xs text-gray-500">{player.TEAM_POSITION}</div>
                    </div>
                </div>
                <div class="flex flex-col items-end text-gray-500">
                    <span><span class="font-semibold text-gray-700">{player.CHAMPIONS_KILLED}/{player.NUM_DEATHS}/{player.ASSISTS}</span></span>
                    <span>KP <span class="font-semibold text-gray-700">{calculateKillParticipation(player)}%</span></span>
                </div>
            </div>

            <!-- Items Row -->
            <div class="flex items-center justify-start gap-1 my-2">
                {#each [player.ITEM0, player.ITEM1, player.ITEM2, player.ITEM3, player.ITEM4, player.ITEM5, player.ITEM6] as itemId}
                    <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                        {#if itemId && itemId !== '0'}
                            <img src={ddragon.getItemImage(itemId)} alt="Item" class="w-full h-full object-cover" />
                        {/if}
                    </div>
                {/each}
            </div>

            <!-- Runes Row -->
            <div class="flex items-center justify-start gap-1 mb-2">
                {#each [player.PERK0, player.PERK1, player.PERK2, player.PERK3, player.PERK4, player.PERK5] as runeId, i}
                    <img
                        class="w-6 h-6 rounded-sm"
                        src={ddragon.getRuneImage(runeId)}
                        alt="Rune"
                        style={i === 4 || i === 6 ? 'margin-left:8px;' : ''}
                    />
                {/each}
            </div>

            <!-- Combat Section -->
            <div class="w-full mt-2">
                <div class="font-semibold text-gray-800 mb-1">Combat</div>
                <div class="flex items-center text-sm mt-1">
                    <span class="mr-2">Damage Dealt: {player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS}</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded"
                            style="width: {Math.max(5, (parseInt(player.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS) / maxStats().damageDealt) * 100)}%; background: {player.TEAM === '100' ? '#3b82f6' : '#ef4444'}"
                        ></div>
                    </div>
                </div>
                <div class="flex items-center text-sm mt-1">
                    <span class="mr-2">Damage Taken: {player.TOTAL_DAMAGE_TAKEN}</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded bg-orange-400"
                            style="width: {Math.max(5, (parseInt(player.TOTAL_DAMAGE_TAKEN) / maxStats().damageTaken) * 100)}%"
                        ></div>
                    </div>
                </div>
                <div class="flex items-center text-sm mt-1">
                    <span class="mr-2">Healing Done: {player.TOTAL_HEAL}</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded bg-green-400"
                            style="width: {Math.max(5, (parseInt(player.TOTAL_HEAL) / maxStats().healingDone) * 100)}%"
                        ></div>
                    </div>
                </div>
            </div>

            <!-- Economy & CS Section -->
            <div class="w-full mt-2">
                <div class="font-semibold text-gray-800 mb-1">Economy & CS</div>
                <div class="flex items-center text-sm">
                    <span class="mr-2">Gold Earned: {formatGold(player.GOLD_EARNED)}</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded bg-yellow-400"
                            style="width: {Math.max(5, (parseInt(player.GOLD_EARNED) / maxStats().gold) * 100)}%"
                        ></div>
                    </div>
                </div>
                <div class="flex items-center text-sm mt-1">
                    <span class="mr-2">CS: {formatCs(player)}</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded bg-purple-400"
                            style="width: {Math.max(5, (formatCs(player) / maxStats().cs) * 100)}%"
                        ></div>
                    </div>
                </div>
            </div>

            <!-- Vision Section -->
            <div class="w-full mt-2">
                <div class="font-semibold text-gray-800 mb-1">Vision</div>
                <div class="flex items-center text-sm">
                    <span class="mr-2">Wards Placed: {player.WARD_PLACED}</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded bg-teal-400"
                            style="width: {Math.max(5, (parseInt(player.WARD_PLACED) / maxStats().wardsPlaced) * 100)}%"
                        ></div>
                    </div>
                </div>
                <div class="flex items-center text-sm mt-1">
                    <span class="mr-2">Wards Killed: {player.WARD_KILLED}</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded bg-pink-400"
                            style="width: {Math.max(5, (parseInt(player.WARD_KILLED) / maxStats().wardsKilled) * 100)}%"
                        ></div>
                    </div>
                </div>
                <div class="flex items-center text-sm mt-1">
                    <span class="mr-2">Control Wards: {player.VISION_WARDS_BOUGHT_IN_GAME}</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded bg-indigo-400"
                            style="width: {Math.max(5, (parseInt(player.VISION_WARDS_BOUGHT_IN_GAME) / maxStats().controlWards) * 100)}%"
                        ></div>
                    </div>
                </div>
            </div>

            <!-- Objectives & Misc Section -->
            <div class="w-full mt-2">
                <div class="font-semibold text-gray-800 mb-1">Objectives & Misc</div>
                <div class="flex items-center text-sm">
                    <span class="mr-2">Objective Damage: {player.TOTAL_DAMAGE_DEALT_TO_OBJECTIVES}</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded bg-slate-400"
                            style="width: {Math.max(5, (parseInt(player.TOTAL_DAMAGE_DEALT_TO_OBJECTIVES) / maxStats().objDamage) * 100)}%"
                        ></div>
                    </div>
                </div>
                <div class="flex items-center text-sm mt-1">
                    <span class="mr-2">Turret Damage: {player.TOTAL_DAMAGE_DEALT_TO_TURRETS}</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded bg-slate-500"
                            style="width: {Math.max(5, (parseInt(player.TOTAL_DAMAGE_DEALT_TO_TURRETS) / maxStats().turretDamage) * 100)}%"
                        ></div>
                    </div>
                </div>
                <div class="flex items-center text-sm mt-1">
                    <span class="mr-2">Time Spent Dead: {Math.floor(parseInt(player.TOTAL_TIME_SPENT_DEAD) / 60)}m {parseInt(player.TOTAL_TIME_SPENT_DEAD) % 60}s</span>
                    <div class="flex-1 h-1 rounded bg-gray-200 relative">
                        <div
                            class="absolute top-0 left-0 h-full rounded bg-gray-400"
                            style="width: {Math.max(5, (parseInt(player.TOTAL_TIME_SPENT_DEAD) / maxStats().timeDead) * 100)}%"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
        {/each}
        {/each}
        {/each}
    </div>
</div>
{/if}