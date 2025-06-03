<script lang="ts">
    import type { PageData } from './$types';
    import { PlayerService } from '$lib/services/player';
    import PlayerName from '$lib/components/player-name.svelte';
    import type { DdragongRepository } from '$lib/services/ddragon';
    import type { ChampionStats, VillianStats, SynergyStats } from './+page.server';
    import { page } from '$app/stores';

    let { data } = $props<{ data: PageData }>();
    let player = $derived(data.player);
    let activeTab = $state('summary');
    let ddragon = $derived(data.ddragon);
    let playerPuuid = $derived($page.params.puuid);

    const formatNumber = (num: number) => {
        return num > 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
    };

    const getWinRate = (wins: number, losses: number) => {
        const total = wins + losses;
        return total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
    };

    const getKDA = (kills: number, deaths: number, assists: number) => {
        return deaths === 0 ? (kills + assists).toFixed(2) : ((kills + assists) / deaths).toFixed(2);
    };

    const getAverage = (total: number, games: number) => {
        return games > 0 ? (total / games).toFixed(1) : '0.0';
    };

    // Helper: timeAgo
    function timeAgo(dateString: string) {
        const now = new Date();
        const date = new Date(dateString);
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
        return date.toLocaleDateString();
    }

    // Helper: formatDuration
    function formatDuration(duration: number|string) {
        // duration in seconds or string
        let secs = typeof duration === 'string' ? parseInt(duration) : duration;
        secs /= 1000;
        const m = Math.floor(secs / 60);
        const s = (secs % 60).toFixed(0);
        return `${m}m ${s.toString().padStart(2, '0')}s`;
    }

    // Get top champions sorted by games played
    let topChampions = $derived(Object.entries(player.stats.champions as Record<string, ChampionStats>)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.games - a.games)
        .slice(0, 5));

    // Champions Table Sorting Logic
    let championSortKey: 'games'|'wins'|'losses'|'winrate'|'kda'|'kills'|'deaths'|'assists'|'creepScore'|'creepScorePerMinute'|'minutesPlayed'|'name' = 'games';
    let championSortDir = $state<'asc'|'desc'>('desc');

    function sortChampions(a: ChampionStats & { name: string }, b: ChampionStats & { name: string }) {
        let key = championSortKey;
        let dir = championSortDir === 'asc' ? 1 : -1;
        if (key === 'name') {
            return a.name.localeCompare(b.name) * dir;
        }
        if (key === 'winrate') {
            // Sort by winrate calculated on the fly
            const aWR = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
            const bWR = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
            return (aWR - bWR) * dir;
        }
        // Only allow sorting by known numeric keys
        const numericKeys: (keyof ChampionStats)[] = ['games', 'wins', 'losses', 'kda', 'kills', 'deaths', 'assists', 'creepScore', 'creepScorePerMinute', 'minutesPlayed'];
        if (numericKeys.includes(key as keyof ChampionStats)) {
            const k = key as keyof ChampionStats;
            return ((a[k] as number) - (b[k] as number)) * dir;
        }
        return 0;
    }

    let championsArray = $derived(
        Object.entries(player.stats.champions as Record<string, ChampionStats>)
            .map(([name, stats]) => ({ name, ...stats }))
    );

    let sortedChampions = $derived([...championsArray].sort(sortChampions));

    function setSort(key: typeof championSortKey) {
        if (championSortKey === key) {
            championSortDir = championSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            championSortKey = key;
            championSortDir = 'desc';
        }
    }

    // Synergy Table Sorting Logic
    let synergySortKey = $state<'games'|'wins'|'losses'|'winrate'|'name'>('wins');
    let synergySortDir = $state<'asc'|'desc'>('desc');
    function sortSynergy(a: SynergyStats & { puuid: string }, b: SynergyStats & { puuid: string }) {
        let key = synergySortKey;
        let dir = synergySortDir === 'asc' ? 1 : -1;
        if (key === 'name') return a.name.localeCompare(b.name) * dir;
        if (key === 'winrate') {
            const aWR = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
            const bWR = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
            return (aWR - bWR) * dir;
        }
        return ((a[key] as number) - (b[key] as number)) * dir;
    }
    let synergyArray = $derived(Object.entries(player.stats.synergies as Record<string, SynergyStats>).map(([puuid, stats]) => ({ puuid, ...stats })));
    let sortedSynergy = $derived([...synergyArray].sort(sortSynergy));
    function setSynergySort(key: typeof synergySortKey) {
        if (synergySortKey === key) {
            synergySortDir = synergySortDir === 'asc' ? 'desc' : 'asc';
        } else {
            synergySortKey = key;
            synergySortDir = 'desc';
        }
    }

    // Villains Table Sorting Logic
    let villainSortKey = $state<'games'|'wins'|'losses'|'winrate'|'puuid'>('losses');
    let villainSortDir = $state<'asc'|'desc'>('desc');
    function sortVillain(a: VillianStats & { puuid: string }, b: VillianStats & { puuid: string }) {
        let key = villainSortKey;
        let dir = villainSortDir === 'asc' ? 1 : -1;
        if (key === 'puuid') return a.puuid.localeCompare(b.puuid) * dir;
        if (key === 'winrate') {
            const aWR = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
            const bWR = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
            return (aWR - bWR) * dir;
        }
        return ((a[key] as number) - (b[key] as number)) * dir;
    }
    let villainArray = $derived(Object.entries(player.stats.villains as Record<string, VillianStats>).map(([puuid, stats]) => ({ puuid, ...stats })));
    let sortedVillains = $derived([...villainArray].sort(sortVillain));
    function setVillainSort(key: typeof villainSortKey) {
        if (villainSortKey === key) {
            villainSortDir = villainSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            villainSortKey = key;
            villainSortDir = 'desc';
        }
    }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- Player Header -->
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
            <h1 class="text-3xl font-bold text-white">{player.name}</h1>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button
                    class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                    onclick={() => activeTab = 'summary'}
                >
                    Summary
                </button>
                <button
                    class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'champions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                    onclick={() => activeTab = 'champions'}
                >
                    Champions
                </button>
                <button
                    class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'synergy' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                    onclick={() => activeTab = 'synergy'}
                >
                    Synergy
                </button>
                <button
                    class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'villains' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
                    onclick={() => activeTab = 'villains'}
                >
                    Villains
                </button>
            </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
            {#if activeTab === 'summary'}
                <!-- Overall Stats -->
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                    <!-- Left Column: Win Rate and Rank -->
                    <div class="space-y-4 col-span-2">
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="text-sm font-medium text-gray-500">Win Rate</h3>
                            <p class="mt-1 text-2xl font-semibold text-gray-900">
                                {getWinRate(player.stats.wins, player.stats.losses)}%
                            </p>
                            <p class="mt-1 text-sm text-gray-500">
                                {player.stats.wins}W {player.stats.losses}L
                            </p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="text-sm font-medium text-gray-500">Rank</h3>
                            <p class="mt-1 text-2xl font-semibold text-gray-900">
                                #{player.rank.position}
                            </p>
                            <p class="mt-1 text-sm text-gray-500">
                                of {player.rank.total} players
                            </p>
                        </div>
                    </div>

                    <!-- Right Column: Top Champions -->
                    <div class="lg:col-span-2">
                        <div class="space-y-2">
                            {#each topChampions as champion}
                                <div class="bg-gray-50 rounded-lg p-3">
                                    <div class="grid grid-cols-4 text-center">
                                        <div class="">
                                            <img 
                                                src={ddragon.getChampionImage(champion.name)} 
                                                alt={champion.name}
                                                title={champion.name}
                                                class="w-10 h-10 rounded-md ring-2 ring-gray-200"
                                            />
                                        </div>
                                        <div>
                                            <div class="text-[10px] text-gray-500">KDA</div>
                                            <div class="text-xs font-medium text-gray-900 tabular-nums">
                                                {Math.round(champion.kills)}/{Math.round(champion.deaths)}/{Math.round(champion.assists)}
                                            </div>
                                            <div class="text-[10px] text-gray-500 tabular-nums">
                                                {Number(champion.kda).toFixed(2)}:1
                                            </div>
                                        </div>
                                        <div>
                                            <div class="text-[10px] text-gray-500">Win Rate</div>
                                            <div class="text-xs font-medium text-gray-900 tabular-nums">
                                                {getWinRate(champion.wins, champion.losses)}%
                                            </div>
                                            <div class="text-[10px] text-gray-500 tabular-nums">
                                                {champion.wins}W {champion.losses}L
                                            </div>
                                        </div>
                                        <div>
                                            <div class="text-[10px] text-gray-500">Games</div>
                                            <div class="text-xs font-medium text-gray-900 tabular-nums">
                                                {champion.games}
                                            </div>
                                            <div class="text-[10px] text-gray-500 tabular-nums">
                                                {Math.round((champion.games / player.stats.totalGames) * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>

                <!-- Position Stats -->
                <div class="mb-8">
                    <h3 class="text-sm font-medium text-gray-500 mb-4">Position Stats</h3>
                    <div class="grid grid-cols-5 gap-2">
                        {#each ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as position}
                            {@const posStats = player.stats.positions[position]}
                            <div class="bg-gray-100 rounded-lg p-3 text-center">
                                <div class="text-[10px] font-medium text-gray-600 mb-1 uppercase">{position}</div>
                                {#if posStats}
                                    <div class="text-sm font-semibold tabular-nums text-gray-900">
                                        {getWinRate(posStats.wins, posStats.losses)}%
                                    </div>
                                    <div class="text-[10px] text-gray-500 tabular-nums">
                                        {posStats.wins}W {posStats.losses}L
                                    </div>
                                {:else}
                                    <div class="text-xs text-gray-400 italic">
                                        No games
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Match History -->
                <div>
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Match History</h2>
                    <div class="space-y-3">
                        {#each player.matches as match}
                            <div class="rounded-lg flex items-stretch text-xs font-medium overflow-hidden shadow border border-gray-900/10 {match.win ? 'bg-green-100' : 'bg-red-100'}">
                                <!-- Left: Main stats -->
                                <div class="flex flex-col justify-between min-h-full">
                                    <div class="flex items-center gap-3 px-4 py-3 min-w-[340px] text-gray-800">
                                        <div class="flex flex-col items-center">
                                            <span class="text-[10px] text-gray-600">{timeAgo(match.date)}</span>
                                            <span class="text-[11px] {match.win ? 'text-green-800' : 'text-red-800'} font-semibold">{match.win ? 'Victory' : 'Defeat'}</span>
                                            <span class="text-[10px] text-gray-500">{formatDuration(match.gameLength)}</span>
                                        </div>
                                        <div class="flex flex-col items-center">
                                            <img src={ddragon.getChampionImage(match.champion)} alt={match.champion} class="w-12 h-12 rounded-md border-2 border-gray-400" />
                                            <div class="flex gap-0.5 mt-1"></div>
                                        </div>
                                        <div class="flex flex-col items-center gap-0.5">
                                            <span class="text-lg font-bold text-black tabular-nums">{match.kills} <span class="text-gray-500">/</span> {match.deaths} <span class="text-gray-500">/</span> {match.assists}</span>
                                            <span class="text-[11px] text-gray-700">{getKDA(match.kills, match.deaths, match.assists)}:1 KDA</span>
                                            <span class="text-[11px] text-gray-700">CS <span class="font-bold text-black">{match.creepScore}</span> <span class="text-gray-500">({match.creepScorePerMinute.toFixed(1)}/min)</span></span>
                                        </div>
                                        <div class="flex gap-0.5 mt-2">
                                            {#each Array(7) as _, i}
                                                <div class="w-8 h-8 rounded bg-gray-200 flex items-center justify-center border border-gray-300">
                                                    {#if match.items && match.items[i] && match.items[i] !== '0'}
                                                        <img src={ddragon.getItemImage(match.items[i])} alt="Item" class="w-full h-full object-cover" />
                                                    {/if}
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                    <a href="/match/{match.fileHash}" class="px-4 pb-2 pt-1 text-[11px] text-gray-500 underline hover:text-blue-600 w-fit">View match details</a>
                                </div>
                                <!-- Right: Teams -->
                                <div class="flex-1 flex flex-col justify-center px-4 py-2">
                                    {#if match.teams && match.teams.length === 2}
                                        <div class="grid grid-cols-2 gap-x-6 gap-y-1">
                                            {#each [0,1] as teamIdx}
                                                <div class="flex flex-col gap-1">
                                                    {#each match.teams[teamIdx] as teammate}
                                                        <div class="flex items-center gap-1 mb-0.5">
                                                            <a href="/champion/{teammate.champion}" class="block"><img src={ddragon.getChampionImage(teammate.champion)} alt={teammate.champion} class="w-5 h-5 rounded" /></a>
                                                            <a href="/player/{teammate.puuid}" class="hover:underline text-xs text-gray-900 font-medium truncate max-w-[90px] {teammate.puuid === playerPuuid ? 'text-yellow-600' : ''}">{teammate.name}</a>
                                                        </div>
                                                    {/each}
                                                </div>
                                            {/each}
                                        </div>
                                    {:else}
                                        <div class="text-xs text-gray-500 italic">Teams data unavailable</div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else if activeTab === 'champions'}
                <!-- Champions Table -->
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 text-xs">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-2 py-2 text-left cursor-pointer" onclick={() => setSort('name')}>Champion</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setSort('games')}>Played</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setSort('wins')}>W</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setSort('losses')}>L</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setSort('winrate')}>Win Rate</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setSort('kda')}>KDA</th>
                                <th class="px-2 py-2 text-center">DMG</th>
                                <th class="px-2 py-2 text-center">Wards</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setSort('creepScore')}>CS</th>
                                <th class="px-2 py-2 text-center">Gold</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">
                            {#each sortedChampions as champ}
                                <tr>
                                    <td class="px-2 py-2 flex items-center gap-2">
                                        <img src={ddragon.getChampionImage(champ.name)} alt={champ.name} class="w-7 h-7 rounded" />
                                        <span class="font-medium">{champ.name}</span>
                                    </td>
                                    <td class="px-2 py-2 text-center">{champ.games}</td>
                                    <td class="px-2 py-2 text-center text-green-700">{champ.wins}</td>
                                    <td class="px-2 py-2 text-center text-red-700">{champ.losses}</td>
                                    <td class="px-2 py-2 text-center">{getWinRate(champ.wins, champ.losses)}%</td>
                                    <td class="px-2 py-2 text-center">{Number(champ.kda).toFixed(2)}</td>
                                    <td class="px-2 py-2 text-center">-</td>
                                    <td class="px-2 py-2 text-center">-</td>
                                    <td class="px-2 py-2 text-center">{champ.creepScore} <span class="text-gray-400">({champ.creepScorePerMinute.toFixed(1)}/min)</span></td>
                                    <td class="px-2 py-2 text-center">-</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else if activeTab === 'synergy'}
                <!-- Synergy Table -->
                <div class="overflow-x-auto">
                    <div class="text-xs text-gray-500 italic mb-2">
                        Statistics when on the same team of {player.name}
                    </div>
                    <table class="min-w-full divide-y divide-gray-200 text-xs">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-2 py-2 text-left cursor-pointer" onclick={() => setSynergySort('name')}>Name</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setSynergySort('games')}>Games</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setSynergySort('wins')}>Wins</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setSynergySort('losses')}>Losses</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setSynergySort('winrate')}>Win Rate</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">
                            {#each sortedSynergy as s}
                                <tr>
                                    <td class="px-2 py-2">
                                        <a href={`/player/${s.puuid}`} class="hover:underline text-blue-700">
                                            <PlayerName puuid={s.puuid} name={s.name} />
                                        </a>
                                    </td>
                                    <td class="px-2 py-2 text-center">{s.games}</td>
                                    <td class="px-2 py-2 text-center">{s.wins}</td>
                                    <td class="px-2 py-2 text-center">{s.losses}</td>
                                    <td class="px-2 py-2 text-center">{getWinRate(s.wins, s.losses)}%</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else if activeTab === 'villains'}
                <!-- Villains Table -->
                <div class="overflow-x-auto">
                    <div class="text-xs text-gray-500 italic mb-2">
                        Statistics when on the opposite team of {player.name}
                    </div>
                    <table class="min-w-full divide-y divide-gray-200 text-xs">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-2 py-2 text-left cursor-pointer" onclick={() => setVillainSort('puuid')}>Name</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setVillainSort('games')}>Games</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setVillainSort('wins')}>Wins</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setVillainSort('losses')}>Losses</th>
                                <th class="px-2 py-2 text-center cursor-pointer" onclick={() => setVillainSort('winrate')}>Win Rate</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">
                            {#each sortedVillains as v}
                                <tr>
                                    <td class="px-2 py-2">
                                        <a href={`/player/${v.puuid}`} class="hover:underline text-blue-700">
                                            <PlayerName puuid={v.puuid} name={v.name} />
                                        </a>
                                    </td>
                                    <td class="px-2 py-2 text-center">{v.games}</td>
                                    <td class="px-2 py-2 text-center">{v.wins}</td>
                                    <td class="px-2 py-2 text-center">{v.losses}</td>
                                    <td class="px-2 py-2 text-center">{getWinRate(v.wins, v.losses)}%</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    </div>
</div> 