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

<main class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center mb-12">
            <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Leaderboard</h1>
        </div>
        
        <div class="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-100">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="bg-gray-50/80 text-sm text-gray-600 uppercase tracking-tight border-b border-gray-200">
                            <th class="sticky top-0 w-16 px-6 py-4 text-left font-semibold">#</th>
                            <th 
                                class="sticky top-0 w-64 px-6 py-4 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                                onclick={() => handleSort('name')}
                            >
                                <div class="flex items-center gap-2">
                                    Player
                                    <span class={`${getSortIcon('name')} w-5 h-5 text-gray-400 group-hover:text-gray-600`}></span>
                                </div>
                            </th>
                            <th 
                                class="sticky top-0 w-24 px-6 py-4 text-center font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                                onclick={() => handleSort('wins')}
                            >
                                <div class="flex items-center justify-center gap-2">
                                    Wins
                                    <span class={`${getSortIcon('wins')} w-5 h-5 text-gray-400 group-hover:text-gray-600`}></span>
                                </div>
                            </th>
                            <th 
                                class="sticky top-0 w-24 px-6 py-4 text-center font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                                onclick={() => handleSort('losses')}
                            >
                                <div class="flex items-center justify-center gap-2">
                                    Losses
                                    <span class={`${getSortIcon('losses')} w-5 h-5 text-gray-400 group-hover:text-gray-600`}></span>
                                </div>
                            </th>
                            <th 
                                class="sticky top-0 px-6 py-4 text-center font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                                onclick={() => handleSort('games')}
                            >
                                <div class="flex items-center justify-center gap-2">
                                    Games
                                    <span class={`${getSortIcon('games')} w-5 h-5 text-gray-400 group-hover:text-gray-600`}></span>
                                </div>
                            </th>
                            <th 
                                class="sticky top-0 w-48 px-6 py-4 text-center font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                                onclick={() => handleSort('winRate')}
                            >
                                <div class="flex items-center justify-center gap-2">
                                    Win Rate
                                    <span class={`${getSortIcon('winRate')} w-5 h-5 text-gray-400 group-hover:text-gray-600`}></span>
                                </div>
                            </th>
                            <th class="sticky top-0 w-24 px-6 py-4 text-center font-semibold">Streak</th>
                            <th class="sticky top-0 w-8"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        {#each sortedLeaderboard as player, index}
                            <tr 
                                class="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                onclick={() => toggleExpand(player.id)}
                                onkeydown={(e) => handleKeydown(e, player.id)}
                                tabindex="0"
                                role="button"
                            >
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg font-bold text-gray-900">{player.rank}</span>
                                        {#if player.rank <= 3}
                                            <span class="text-lg">
                                                {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}
                                            </span>
                                        {/if}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
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
                                <td class="px-6 py-4 text-center tabular-nums text-green-600">
                                    {player.wins}
                                </td>
                                <td class="px-6 py-4 text-center tabular-nums text-red-600">
                                    {player.losses}
                                </td>
                                <td class="px-6 py-4 text-center tabular-nums text-gray-900">
                                    {player.wins + player.losses}
                                </td>
                                <td class="px-6 py-4">
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
                                <td class="px-6 py-4 text-center tabular-nums">
                                    <span class={player.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'}>
                                        {player.streak}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
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
                                <tr class="bg-gray-50/50">
                                    <td colspan="9" class="px-6 py-6">
                                        <div class="flex divide-x divide-gray-200">
                                            <div class="flex-1 px-6 first:pl-0 last:pr-0">
                                                <div class="space-y-3">
                                                    {#each player.topChampions as champion}
                                                        <div class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                                            <div class="flex items-center gap-2">
                                                                <div class="w-12 h-12 flex-shrink-0">
                                                                    <img 
                                                                        src={ddragon.getChampionImage(champion.name)} 
                                                                        alt={champion.name}
                                                                        title={champion.name}
                                                                        class="w-12 h-12 rounded-md ring-2 ring-gray-200"
                                                                    />
                                                                </div>
                                                                <div class="flex-1">
                                                                    <div class="grid grid-cols-3 gap-4 mt-2">
                                                                        <div class="text-center">
                                                                            <div class="text-xs text-gray-500 mb-1">KDA</div>
                                                                            <div class="text-sm font-medium text-gray-900">
                                                                                {champion.kills}/{champion.deaths}/{champion.assists}
                                                                            </div>
                                                                            <div class="text-xs text-gray-500 mt-0.5">
                                                                                {champion.kda}:1
                                                                            </div>
                                                                        </div>
                                                                        <div class="text-center">
                                                                            <div class="text-xs text-gray-500 mb-1">CS</div>
                                                                            <div class="text-sm font-medium text-gray-900">
                                                                                {champion.creepScore}
                                                                            </div>
                                                                            <div class="text-xs text-gray-500 mt-0.5">
                                                                                {champion.creepScorePerMinute}/min
                                                                            </div>
                                                                        </div>
                                                                        <div class="text-center">
                                                                            <div class="text-xs text-gray-500 mb-1">Win Rate</div>
                                                                            <div class="text-sm font-medium text-gray-900">
                                                                                {Math.round((champion.wins / champion.games) * 100)}%
                                                                            </div>
                                                                            <div class="text-xs text-gray-500 mt-0.5">
                                                                                {champion.wins}W {champion.losses}L
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    {/each}
                                                </div>
                                            </div>
                                            <div class="flex-1 px-6">
                                                <div class="grid grid-cols-6 gap-4">
                                                    {#each ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as position}
                                                        {@const posStats = player.positionStats.find((p: LeaderboardPositionStats) => p.name === position)}
                                                        <div class="col-span-2 bg-gray-100 rounded-lg p-4 text-center hover:bg-gray-200 transition-colors">
                                                            <div class="text-sm font-medium text-gray-600 mb-2">{position}</div>
                                                            {#if posStats}
                                                                <div class="text-base tabular-nums text-gray-900">
                                                                    {posStats.wins}W {posStats.losses}L
                                                                </div>
                                                                <div class="text-sm text-gray-500 tabular-nums mt-1">
                                                                    {Math.round(posStats.winRate * 100)}%
                                                                </div>
                                                            {:else}
                                                                <div class="text-sm text-gray-400 mt-2">
                                                                    No games
                                                                </div>
                                                            {/if}
                                                        </div>
                                                        {#if position === 'MIDDLE'}
                                                            <div class="cols-span-1"></div>
                                                        {/if}
                                                    {/each}
                                                </div>
                                            </div>
                                            <div class="flex-1 px-6">
                                                <div class="space-y-3">
                                                    {#each player.matchResults.slice(0, 5) as match}
                                                        <a 
                                                            href="/match/{match.fileHash}"
                                                            class="block hover:opacity-90 transition-opacity"
                                                        >
                                                            <div 
                                                                class={`
                                                                    p-1 rounded-lg flex items-center gap-4
                                                                    ${match.win ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                                                                    ${match.win ? 'ring-2 ring-green-100' : 'ring-2 ring-red-100'}
                                                                `}
                                                            >
                                                                <div class={`font-medium text-xs ${match.win ? 'text-green-600' : 'text-red-600'} mr-1 ml-2`}>
                                                                    {match.win ? 'Win' : 'Loss'}
                                                                </div>
                                                                <div class="w-8 h-8 flex-shrink-0">
                                                                    <img src={ddragon.getChampionImage(match.champion)} alt={match.champion} class="w-8 h-8 rounded-md" />
                                                                </div>
                                                                <div class="flex-1 min-w-0">
                                                                    <div class="grid grid-cols-3 justify-between text-xs text-gray-900 font-medium">
                                                                        <div>
                                                                            <span class="text-sm font-semibold ">{match.kills}</span>
                                                                            <span class="text-gray-500">/</span>
                                                                            <span class="text-sm font-semibold tabular-nums">{match.deaths}</span>
                                                                            <span class="text-gray-500">/</span>
                                                                            <span class="text-sm font-semibold tabular-nums">{match.assists}</span>
                                                                        </div>
                                                                        <div class="col-span-2 self-center">
                                                                            <span class="text-gray-600 tabular-nums">CS {match.creepScore} ({match.creepScorePerMinute})</span>
                                                                        </div>
                                                                    </div>
                                                                    <div class="text-xs text-gray-500 grid grid-cols-4 gap-2 mt-1">
                                                                        <span class="font-medium">{match.position}</span>
                                                                        <span class="col-auto text-center">{Math.floor(match.gameLength / 1000 / 60)}m</span>
                                                                        <span class="text-right">{new Date(match.date).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </a>
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
    </div>
</main>
