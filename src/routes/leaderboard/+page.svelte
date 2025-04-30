<script lang="ts">
    import type { LeaderboardPlayer, LeaderboardPositionStats } from './+page.server';
    
    const { data } = $props<{ data: { leaderboard: LeaderboardPlayer[] } }>();
    const ddragon = $derived(data.ddragon);



    let leaderboard = $derived(data.leaderboard || []);
    let expandedPlayer = $state<string | null>(null);
    let sortField = $state<keyof LeaderboardPlayer | 'games' | 'winRate' | 'name'>('wins');
    let sortDirection = $state<'asc' | 'desc'>('desc');

    function toggleExpand(playerId: string) {
        expandedPlayer = expandedPlayer === playerId ? null : playerId;
    }

    function getWinRate(wins: number, losses: number) {
        const total = wins + losses;
        return total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
    }

    function handleKeydown(e: KeyboardEvent, playerId: string) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpand(playerId);
        }
    }

    function handleSort(field: typeof sortField) {
        if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortField = field;
            sortDirection = 'desc';
        }
    }

    let sortedLeaderboard = $derived([...leaderboard].sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (sortField) {
            case 'games':
                aValue = a.wins + a.losses;
                bValue = b.wins + b.losses;
                break;
            case 'winRate':
                aValue = Number(getWinRate(a.wins, a.losses));
                bValue = Number(getWinRate(b.wins, b.losses));
                break;
            case 'name':
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                return sortDirection === 'asc' 
                    ? aName.localeCompare(bName)
                    : bName.localeCompare(aName);
            default:
                aValue = a[sortField] as number;
                bValue = b[sortField] as number;
        }

        return sortDirection === 'asc' 
            ? aValue - bValue 
            : bValue - aValue;
    }));

    function getSortIcon(field: typeof sortField) {
        if (sortField !== field) {
            return 'icon-[mdi--swap-vertical]';
        }
        return sortDirection === 'asc' 
            ? 'icon-[mdi--arrow-up]'
            : 'icon-[mdi--arrow-down]';
    }

    function getExpandIcon(isExpanded: boolean) {
        return isExpanded ? 'icon-[mdi--chevron-up]' : 'icon-[mdi--chevron-down]';
    }
</script>

<main class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8 text-center text-gray-900">Leaderboard</h1>
        
        <div class="bg-white rounded-lg overflow-hidden shadow-lg">
            <table class="w-full">
                <thead>
                    <tr class="bg-gray-100 text-sm text-gray-600 uppercase tracking-wider">
                        <th class="w-16 px-4 py-3 text-left font-medium">#</th>
                        <th 
                            class="w-64 px-4 py-3 text-left font-medium cursor-pointer hover:bg-gray-200 group"
                            onclick={() => handleSort('name')}
                        >
                            <div class="flex items-center gap-1">
                                Player
                                <span class={`${getSortIcon('name')} w-4 h-4 text-gray-400 group-hover:text-gray-600`}></span>
                            </div>
                        </th>
                        <th 
                            class="w-24 px-4 py-3 text-center font-medium cursor-pointer hover:bg-gray-200 group"
                            onclick={() => handleSort('wins')}
                        >
                            <div class="flex items-center justify-center gap-1">
                                Wins
                                <span class={`${getSortIcon('wins')} w-4 h-4 text-gray-400 group-hover:text-gray-600`}></span>
                            </div>
                        </th>
                        <th 
                            class="w-24 px-4 py-3 text-center font-medium cursor-pointer hover:bg-gray-200 group"
                            onclick={() => handleSort('losses')}
                        >
                            <div class="flex items-center justify-center gap-1">
                                Losses
                                <span class={`${getSortIcon('losses')} w-4 h-4 text-gray-400 group-hover:text-gray-600`}></span>
                            </div>
                        </th>
                        <th 
                            class="px-4 py-3 text-center font-medium cursor-pointer hover:bg-gray-200 group"
                            onclick={() => handleSort('games')}
                        >
                            <div class="flex items-center justify-center gap-1">
                                Games
                                <span class={`${getSortIcon('games')} w-4 h-4 text-gray-400 group-hover:text-gray-600`}></span>
                            </div>
                        </th>
                        <th 
                            class="w-48 px-4 py-3 text-center font-medium cursor-pointer hover:bg-gray-200 group"
                            onclick={() => handleSort('winRate')}
                        >
                            <div class="flex items-center justify-center gap-1">
                                Win Rate
                                <span class={`${getSortIcon('winRate')} w-4 h-4 text-gray-400 group-hover:text-gray-600`}></span>
                            </div>
                        </th>
                        <th class="w-24 px-4 py-3 text-center font-medium">Streak</th>
                        <th class="w-8"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    {#each sortedLeaderboard as player, index}
                        <tr 
                            class="hover:bg-blue-50/50 transition-colors"
                            onclick={() => toggleExpand(player.id)}
                            onkeydown={(e) => handleKeydown(e, player.id)}
                            tabindex="0"
                            role="button"
                        >
                            <td class="px-4 py-4 text-lg font-bold">{player.rank}</td>
                            <td class="px-4 py-4">
                                <div class="flex items-center space-x-3 text-gray-900">
                                    <div class="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        <img 
                                            src={ddragon.getChampionImage(player.topChampions[0].name)} 
                                            alt={player.topChampions[0].name} 
                                            class="rounded-full"
                                            style="transform: scale(1.1);"
                                        />
                                    </div>
                                    <div>
                                        <div class="font-medium text-gray-900">{player.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-4 text-center tabular-nums text-green-600">
                                {player.wins}
                            </td>
                            <td class="px-4 py-4 text-center tabular-nums text-red-600">
                                {player.losses}
                            </td>
                            <td class="px-4 py-4 text-center tabular-nums text-gray-900">
                                {player.wins + player.losses}
                            </td>
                            <td class="px-4 py-4">
                                <div class="flex items-center justify-center">
                                    <div class="w-full bg-gray-200 rounded-full h-2 mr-2">
                                        <div 
                                            class="bg-blue-500 h-2 rounded-full" 
                                            style="width: {getWinRate(player.wins, player.losses)}%"
                                        ></div>
                                    </div>
                                    <span class="text-sm tabular-nums w-12 text-right text-gray-900">
                                        {getWinRate(player.wins, player.losses)}%
                                    </span>
                                </div>
                            </td>
                            <td class="px-4 py-4 text-center tabular-nums">
                                <span class={player.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'}>
                                    {player.streak}
                                </span>
                            </td>
                            <td class="px-4 py-4">
                                <svg 
                                    class={`w-4 h-4 transform transition-transform duration-200 ${expandedPlayer === player.id ? 'rotate-180' : ''} text-gray-400`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </td>
                        </tr>
                        {#if expandedPlayer === player.id}
                            <tr class="bg-gray-50">
                                <td colspan="9" class="px-4 py-4">
                                    <div class="grid grid-cols-6 gap-3">
                                        <div class="col-span-2">
                                            <h4 class="text-sm font-medium text-gray-500 mb-2">Most Played Champions</h4>
                                            <div class="space-y-1">
                                                {#each player.topChampions as champion}
                                                    <div class="flex items-center bg-gray-50/50 rounded p-1.5">
                                                        <div class="w-8 h-8 flex-shrink-0">
                                                            <img 
                                                                src={ddragon.getChampionImage(champion.name)} 
                                                                alt={champion.name} 
                                                                class="w-8 h-8 rounded-full"
                                                            />
                                                        </div>
                                                        <div class="ml-2 flex flex-col">
                                                            <div class="flex items-center space-x-2">
                                                                <span class="text-sm text-gray-900 font-medium">{champion.name}</span>
                                                                <span class="text-sm text-gray-500 tabular-nums">
                                                                    {(champion.kills)}/{(champion.deaths)}/{(champion.assists)}
                                                                </span>
                                                            </div>
                                                            <div class="text-xs text-gray-500 tabular-nums">
                                                                CS {champion.creepScore} ({champion.creepScorePerMinute.toFixed(1)}) - {champion.wins + champion.losses} games - {Math.round((champion.wins / (champion.wins + champion.losses)) * 100)}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 class="text-sm font-medium text-gray-500 mb-2">Performance</h4>
                                            <div class="space-y-1">
                                                <div class="flex gap-4 text-sm">
                                                    <span class="text-gray-600">Wins</span>
                                                    <span class="text-green-600 tabular-nums">{player.wins}</span>
                                                </div>
                                                <div class="flex gap-4 text-sm">
                                                    <span class="text-gray-600">Losses</span>
                                                    <span class="text-red-600 tabular-nums">{player.losses}</span>
                                                </div>
                                                <div class="flex gap-4 text-sm">
                                                    <span class="text-gray-600">Win Rate</span>
                                                    <span class="text-gray-900 tabular-nums">{getWinRate(player.wins, player.losses)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-span-2">
                                            <h4 class="text-sm font-medium text-gray-500 mb-2">Positions</h4>
                                            <div class="grid grid-cols-5 gap-2">
                                                {#each ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as position}
                                                    {@const posStats = player.positionStats.find((p: LeaderboardPositionStats) => p.name === position)}
                                                    <div class="bg-gray-50/50 rounded p-2 text-center">
                                                        <div class="text-xs text-gray-600 mb-1">{position}</div>
                                                        {#if posStats}
                                                            <div class="text-sm tabular-nums font-medium">
                                                                {posStats.wins}W {posStats.losses}L
                                                            </div>
                                                            <div class="text-xs text-gray-500 tabular-nums">
                                                                {Math.round(posStats.winRate * 100)}%
                                                            </div>
                                                        {:else}
                                                            <div class="text-xs text-gray-400">
                                                                No games
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                        <div class="ml-auto">
                                            <h4 class="text-right text-sm font-medium text-gray-500 mb-2">Recent Games</h4>
                                            <div class="flex space-x-1">
                                                {#each player.matchResults.slice(-5) as result}
                                                    <div class={`w-8 h-8 rounded ${result === 'W' ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center text-xs ${result === 'W' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {result}
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</main>
