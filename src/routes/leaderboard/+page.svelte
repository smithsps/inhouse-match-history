<script lang="ts">
    import type { LeaderboardPlayer, LeaderboardPositionStats } from './+page.server';

    const { data } = $props<{ data: { leaderboard: LeaderboardPlayer[], ddragon: any } }>();
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

<main class="min-h-screen">
    <div class="mx-auto lg:px-8 py-8">
        <div class="text-center mb-8">
            <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Leaderboard</h1>
        </div>
        
        <div class="bg-white rounded-xl shadow-xl border border-gray-100">
            <div class="hidden lg:block">
                <div class="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_2fr_1fr_2rem] w-full">
                    <div class="contents sticky top-0 z-10 bg-gray-50/80 border-b border-gray-200">
                        <div class="px-6 py-4 text-left font-semibold text-sm text-gray-600 uppercase tracking-tight">#</div>
                        <div 
                            class="w-64 px-6 py-4 text-left font-semibold cursor-pointer hover:bg-gray-100 transition-colors group text-sm text-gray-600 uppercase tracking-tight"
                            onclick={() => handleSort('name')}
                            role="button"
                            tabindex="0"
                            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('name') }}
                        >
                            <div class="flex items-center gap-2">
                                Player
                                <span class={`${getSortIcon('name')} w-5 h-5 text-gray-400 group-hover:text-gray-600`}></span>
                            </div>
                        </div>
                        <div 
                            class="px-6 py-4 text-center font-semibold cursor-pointer hover:bg-gray-100 transition-colors group text-sm text-gray-600 uppercase tracking-tight"
                            onclick={() => handleSort('wins')}
                            role="button"
                            tabindex="0"
                            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('wins') }}
                        >
                            <div class="flex items-center justify-center gap-2">
                                Wins
                                <span class={`${getSortIcon('wins')} w-5 h-5 text-gray-400 group-hover:text-gray-600`}></span>
                            </div>
                        </div>
                        <div 
                            class="px-6 py-4 text-center font-semibold cursor-pointer hover:bg-gray-100 transition-colors group text-sm text-gray-600 uppercase tracking-tight"
                            onclick={() => handleSort('losses')}
                            role="button"
                            tabindex="0"
                            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('losses') }}
                        >
                            <div class="flex items-center justify-center gap-2">
                                Losses
                                <span class={`${getSortIcon('losses')} w-5 h-5 text-gray-400 group-hover:text-gray-600`}></span>
                            </div>
                        </div>
                        <div 
                            class="px-6 py-4 text-center font-semibold cursor-pointer hover:bg-gray-100 transition-colors group text-sm text-gray-600 uppercase tracking-tight"
                            onclick={() => handleSort('games')}
                            role="button"
                            tabindex="0"
                            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('games') }}
                        >
                            <div class="flex items-center justify-center gap-2">
                                Games
                                <span class={`${getSortIcon('games')} w-5 h-5 text-gray-400 group-hover:text-gray-600`}></span>
                            </div>
                        </div>
                        <div 
                            class="px-6 py-4 text-center font-semibold cursor-pointer hover:bg-gray-100 transition-colors group text-sm text-gray-600 uppercase tracking-tight"
                            onclick={() => handleSort('winRate')}
                            role="button"
                            tabindex="0"
                            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('winRate') }}
                        >
                            <div class="flex items-center justify-center gap-2">
                                Win Rate
                                <span class={`${getSortIcon('winRate')} w-5 h-5 text-gray-400 group-hover:text-gray-600`}></span>
                            </div>
                        </div>
                        <div class="px-6 py-4 text-center font-semibold text-sm text-gray-600 uppercase tracking-tight">Streak</div>
                        <div class=""></div>
                    </div>

                    {#each sortedLeaderboard as player, index (player.id)}
                        <div 
                            class="contents group hover:bg-blue-50/30 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                            onclick={() => toggleExpand(player.id)}
                            onkeydown={(e) => handleKeydown(e, player.id)}
                            tabindex="0"
                            role="button"
                            aria-expanded={expandedPlayer === player.id}
                            aria-controls={`details-${player.id}`}
                        >
                            <div class="px-6 py-4 flex items-center gap-2 group-hover:bg-blue-50/30">
                                <span class="text-lg font-bold text-gray-900">{player.rank}</span>
                                {#if player.rank <= 3}
                                    <span class="text-lg">
                                        {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}
                                    </span>
                                {/if}
                            </div>
                            <div class="px-6 py-4 flex items-center space-x-3 text-gray-900 group-hover:bg-blue-50/30">
                                <div class="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    <img 
                                        src={ddragon.getChampionImage(player.topChampions[0].name)} 
                                        alt={player.topChampions[0].name} 
                                        class="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900">{player.name}</div>
                                </div>
                            </div>
                            <div class="px-6 py-4 text-center tabular-nums text-green-600 group-hover:bg-blue-50/30 flex items-center justify-center">
                                {player.wins}
                            </div>
                            <div class="px-6 py-4 text-center tabular-nums text-red-600 group-hover:bg-blue-50/30 flex items-center justify-center">
                                {player.losses}
                            </div>
                            <div class="px-6 py-4 text-center tabular-nums text-gray-900 group-hover:bg-blue-50/30 flex items-center justify-center">
                                {player.wins + player.losses}
                            </div>
                            <div class="px-6 py-4 group-hover:bg-blue-50/30 flex items-center justify-center">
                                <div class="w-full flex items-center justify-center">
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
                            </div>
                            <div class="px-6 py-4 text-center tabular-nums group-hover:bg-blue-50/30 flex items-center justify-center">
                                <span class={player.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'}>
                                    {player.streak}
                                </span>
                            </div>
                            <div class="py-4 mr-4 flex items-center justify-center group-hover:bg-blue-50/30">
                                <svg 
                                    class={`w-4 h-4 transform transition-transform duration-200 ${expandedPlayer === player.id ? 'rotate-180' : ''} text-gray-400`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        
                        {#if expandedPlayer === player.id}
                            <div class="col-span-full bg-gray-50/50 border-b border-gray-200" id={`details-${player.id}`}>
                                <div class="px-6 py-6">
                                    <div class="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                                        <div class="flex-1 py-4 lg:px-6 first:pt-0 lg:first:pl-0 last:pb-0 lg:last:pr-0">
                                            <div class="space-y-3">
                                                {#each player.topChampions as champion}
                                                    <div class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                                                        <div class="flex items-center gap-3">
                                                            <div class="w-12 h-12 flex-shrink-0">
                                                                <img 
                                                                    src={ddragon.getChampionImage(champion.name)} 
                                                                    alt={champion.name}
                                                                    title={champion.name}
                                                                    class="w-12 h-12 rounded-md ring-2 ring-gray-200"
                                                                />
                                                            </div>
                                                            <div class="flex-1">
                                                                <div class="grid grid-cols-3 gap-4">
                                                                    <div class="text-center">
                                                                        <div class="text-xs text-gray-500 mb-1">KDA</div>
                                                                        <div class="text-sm font-medium text-gray-900 tabular-nums">
                                                                            {champion.kills}/{champion.deaths}/{champion.assists}
                                                                        </div>
                                                                        <div class="text-xs text-gray-500 mt-0.5 tabular-nums">
                                                                            {champion.kda}:1
                                                                        </div>
                                                                    </div>
                                                                    <div class="text-center">
                                                                        <div class="text-xs text-gray-500 mb-1">CS</div>
                                                                        <div class="text-sm font-medium text-gray-900 tabular-nums">
                                                                            {champion.creepScore}
                                                                        </div>
                                                                        <div class="text-xs text-gray-500 mt-0.5 tabular-nums">
                                                                            {champion.creepScorePerMinute}/min
                                                                        </div>
                                                                    </div>
                                                                    <div class="text-center">
                                                                        <div class="text-xs text-gray-500 mb-1">Win Rate</div>
                                                                        <div class="text-sm font-medium text-gray-900 tabular-nums">
                                                                            {Math.round((champion.wins / champion.games) * 100)}%
                                                                        </div>
                                                                        <div class="text-xs text-gray-500 mt-0.5 tabular-nums">
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
                                        <div class="flex-1 lg:px-6 first:pt-0 lg:first:pl-0 last:pb-0 lg:last:pr-0">
                                            <div class="grid grid-cols-2 gap-3">
                                                {#each ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as position}
                                                    {@const posStats = player.positionStats.find((p: LeaderboardPositionStats) => p.name === position)}
                                                    <div class="bg-gray-100 rounded-lg p-3 text-center">
                                                        <div class="text-xs font-medium text-gray-600 mb-1 uppercase">{position}</div>
                                                        {#if posStats}
                                                            <div class="text-sm tabular-nums text-gray-900">
                                                                {posStats.wins}W {posStats.losses}L
                                                            </div>
                                                            <div class="text-xs text-gray-500 tabular-nums mt-0.5">
                                                                {Math.round(posStats.winRate * 100)}%
                                                            </div>
                                                        {:else}
                                                            <div class="text-xs text-gray-400 italic mt-1">
                                                                N/A
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                        <div class="flex-1 lg:px-6 first:pt-0 lg:first:pl-0 last:pb-0 lg:last:pr-0">
                                            <div class="space-y-2">
                                                {#each player.matchResults.slice(0, 5) as match}
                                                    <a 
                                                        href="/match/{match.fileHash}"
                                                        class="block hover:opacity-80 transition-opacity"
                                                        aria-label="View match details for match on {new Date(match.date).toLocaleDateString()} playing {match.champion}"
                                                    >
                                                        <div 
                                                            class={`
                                                                p-2 rounded-lg flex items-center gap-3 text-xs
                                                                ${match.win ? 'bg-green-100/70' : 'bg-red-100/70'}
                                                            `}
                                                        >
                                                            <div class={`font-semibold w-8 text-center ${match.win ? 'text-green-700' : 'text-red-700'}`}>
                                                                {match.win ? 'Win' : 'Loss'}
                                                            </div>
                                                            <div class="w-8 h-8 flex-shrink-0">
                                                                <img src={ddragon.getChampionImage(match.champion)} alt={match.champion} class="w-8 h-8 rounded-md" />
                                                            </div>
                                                            <div class="flex-1 min-w-0">
                                                                <div class="flex justify-between items-center text-gray-900 font-medium mb-1">
                                                                    <div class="whitespace-nowrap tabular-nums">
                                                                        <span class="font-semibold">{match.kills}</span>
                                                                        <span class="text-gray-500">/</span>
                                                                        <span class="font-semibold">{match.deaths}</span>
                                                                        <span class="text-gray-500">/</span>
                                                                        <span class="font-semibold">{match.assists}</span>
                                                                    </div>
                                                                    <div class="text-gray-600 tabular-nums">
                                                                        CS {match.creepScore} ({match.creepScorePerMinute})
                                                                    </div>
                                                                </div>
                                                                <div class="flex justify-between text-gray-500">
                                                                    <span class="font-medium text-xs uppercase">{match.position}</span>
                                                                    <span>{Math.floor(match.gameLength / 1000 / 60)}m</span>
                                                                    <span>{new Date(match.date).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>
                                                {/each}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>

            <div class="lg:hidden">
                {#each sortedLeaderboard as player, index (player.id)}
                    <div class="p-4 border-b border-gray-200 last:border-b-0">
                        <div 
                            class="flex items-center justify-between cursor-pointer"
                            onclick={() => toggleExpand(player.id)}
                            onkeydown={(e) => handleKeydown(e, player.id)}
                            tabindex="0"
                            role="button"
                            aria-expanded={expandedPlayer === player.id}
                            aria-controls={`mobile-details-${player.id}`}                        
                        >
                            <div class="flex items-center space-x-3">
                                <span class="font-bold w-6 text-center">{player.rank}</span>
                                <div class="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                    <img 
                                        src={ddragon.getChampionImage(player.topChampions[0].name)} 
                                        alt={player.topChampions[0].name} 
                                        class="w-full h-full object-cover"
                                    />
                                </div>
                                <span class="font-medium text-gray-900">{player.name}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-sm tabular-nums">
                                    {player.wins}W / {player.losses}L
                                </span>
                                <svg 
                                    class={`w-4 h-4 transform transition-transform duration-200 ${expandedPlayer === player.id ? 'rotate-180' : ''} text-gray-400`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {#if expandedPlayer === player.id}
                            <div class="mt-3 pt-3 border-t border-gray-100 space-y-4" id={`mobile-details-${player.id}`}>
                                <div class="grid grid-cols-2 gap-2 mb-2">
                                    <div class="rounded-lg p-3">
                                        <div class="text-xs text-gray-600 font-medium mb-1">Overall Stats</div>
                                        <div class="grid grid-cols-2 gap-2 text-center">
                                            <div>
                                                <div class="text-[10px] text-gray-600">Win Rate</div>
                                                <div class="text-sm font-semibold tabular-nums">
                                                    {getWinRate(player.wins, player.losses)}%
                                                </div>
                                            </div>
                                            <div>
                                                <div class="text-[10px] text-gray-600">Games</div>
                                                <div class="text-sm font-semibold tabular-nums">
                                                    {player.wins + player.losses}
                                                </div>
                                            </div>
                                            <div>
                                                <div class="text-[10px] text-gray-600">Wins</div>
                                                <div class="text-sm font-semibold text-green-600 tabular-nums">
                                                    {player.wins}
                                                </div>
                                            </div>
                                            <div>
                                                <div class="text-[10px] text-gray-600">Losses</div>
                                                <div class="text-sm font-semibold text-red-600 tabular-nums">
                                                    {player.losses}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="rounded-lg p-3">
                                        <div class="text-xs font-medium text-gray-600">Current Streak</div>
                                        <div class="flex items-center justify-center h-full">
                                            <span class={`text-5xl font-bold ${player.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'}`}>
                                                {player.streak}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div class="text-xs font-medium text-gray-600 mb-2">Top Champions</div>
                                    <div class="space-y-2">
                                        {#each player.topChampions as champion}
                                            <div class="bg-gray-50 rounded-lg p-3">
                                                <div class="flex items-center gap-3 mb-2">
                                                    <div class="w-10 h-10 flex-shrink-0">
                                                        <img 
                                                            src={ddragon.getChampionImage(champion.name)} 
                                                            alt={champion.name}
                                                            title={champion.name}
                                                            class="w-10 h-10 rounded-md ring-2 ring-gray-200"
                                                        />
                                                    </div>
                                                    <div class="flex-1">
                                                        <div class="font-medium text-gray-900">{champion.name}</div>
                                                        <div class="text-xs text-gray-500">
                                                            {champion.games} games played
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="grid grid-cols-4 gap-2 text-center">
                                                    <div>
                                                        <div class="text-[10px] text-gray-500">KDA</div>
                                                        <div class="text-xs font-medium text-gray-900 tabular-nums">
                                                            {champion.kda}:1
                                                        </div>
                                                        <div class="text-[10px] text-gray-500 tabular-nums">
                                                            {champion.kills}/{champion.deaths}/{champion.assists}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div class="text-[10px] text-gray-500">CS</div>
                                                        <div class="text-xs font-medium text-gray-900 tabular-nums">
                                                            {champion.creepScore}
                                                        </div>
                                                        <div class="text-[10px] text-gray-500 tabular-nums">
                                                            {champion.creepScorePerMinute}/min
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div class="text-[10px] text-gray-500">Win Rate</div>
                                                        <div class="text-xs font-medium text-gray-900 tabular-nums">
                                                            {Math.round((champion.wins / champion.games) * 100)}%
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
                                                            {Math.round((champion.games / (player.wins + player.losses)) * 100)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
    
                                <div>
                                    <div class="text-xs font-medium text-gray-600 mb-2">Position Stats</div>
                                    <div class="grid grid-cols-5 gap-1.5">
                                        {#each ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as position}
                                            {@const posStats = player.positionStats.find((p: LeaderboardPositionStats) => p.name === position)}
                                            <div class="bg-gray-100 rounded-lg p-2 text-center">
                                                <div class="text-[10px] font-medium text-gray-600 mb-1 uppercase">{position}</div>
                                                {#if posStats}
                                                    <div class="text-sm font-semibold tabular-nums text-gray-900">
                                                        {Math.round(posStats.winRate * 100)}%
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

                                <div>
                                    <div class="text-xs font-medium text-gray-600 mb-2">Recent Matches</div>
                                    <div class="space-y-2">
                                        {#each player.matchResults.slice(0, 5) as match}
                                            <a 
                                                href="/match/{match.fileHash}"
                                                class="block hover:opacity-80 transition-opacity"
                                                aria-label="View match details for match on {new Date(match.date).toLocaleDateString()} playing {match.champion}"
                                            >
                                                <div 
                                                    class={`
                                                        p-3 rounded-lg flex items-center gap-3
                                                        ${match.win ? 'bg-green-50' : 'bg-red-50'}
                                                    `}
                                                >
                                                    <div class="w-8 h-8 flex-shrink-0">
                                                        <img src={ddragon.getChampionImage(match.champion)} alt={match.champion} class="w-8 h-8 rounded-md" />
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <div class="flex justify-between items-center mb-1">
                                                            <div class="font-medium text-gray-900">{match.champion}</div>
                                                            <div class={`text-xs font-semibold ${match.win ? 'text-green-600' : 'text-red-600'}`}>
                                                                {match.win ? 'Victory' : 'Defeat'}
                                                            </div>
                                                        </div>
                                                        <div class="grid grid-cols-2 gap-2 text-xs">
                                                            <div class="text-gray-600">
                                                                <span class="font-medium">KDA:</span> {match.kills}/{match.deaths}/{match.assists}
                                                            </div>
                                                            <div class="text-gray-600">
                                                                <span class="font-medium">CS</span> {match.creepScore} ({match.creepScorePerMinute}/min)
                                                            </div>
                                                            <div class="text-gray-500">
                                                                <span class="font-medium">{match.position}</span>
                                                            </div> 
                                                            <div class="text-gray-500">
                                                                {Math.floor(match.gameLength / 1000 / 60)}m • {new Date(match.date).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</main>
