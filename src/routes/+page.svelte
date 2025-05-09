<script lang="ts">
    import MatchPreview from '$lib/components/match-preview.svelte';
    import type { Match } from '$lib/models/match';
    import type { RoflPlayerStats } from '$lib/models/rofl';
    import { PlayerService } from '$lib/services/player';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    let matches: Match[] = $derived(data.matches); // Matches from the page props

    let searchQuery = $state('');

    const filteredMatches = $derived(
        matches.filter(match => {
            return match.data.metadata.statsJson.some((player: RoflPlayerStats) => {
                const playerName = PlayerService.getPlayerName(player.PUUID, player.RIOT_ID_GAME_NAME || player.NAME);
                return playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    player.SKIN.toLowerCase().includes(searchQuery.toLowerCase());
            });
        })
    );
</script>

<div>
    <input
        type="text"
        placeholder="Filter matches by player or champion..."
        bind:value={searchQuery}
        class="p-2 border rounded w-full"
    />
    <div class="text-gray-500 mt-1 mb-4 text-xs ml-2">
        {#if filteredMatches.length === 0}
            <span>No matches found</span>
        {:else if filteredMatches.length === matches.length}
            <span>All {matches.length} matches displayed</span>
        {:else}
            <span><i>Showing {filteredMatches.length} out of {matches.length} matches</i></span>
        {/if}
    </div>

    {#each filteredMatches as match (match.id)}
    <div class="mb-3 rounded-lg">
        <a href={`/match/${match.file_hash}`} class="text-sm text-gray-500 mb-2">
            <div class="flex items-center space-x-4 text-gray-700 ml-2">
                <div class="text-xs font-medium text-gray-500">{new Date(match.match_date).toLocaleDateString()}</div>
                <div class="text-xs text-gray-500">{new Date(match.match_date).toLocaleTimeString()}</div>
                <div class="text-xs text-gray-500">{match.match_id}</div>
                <div class="text-xs text-gray-500">{match.data.gameVersion}</div>
                {#if match.draft_data}
                    <div class="text-xs text-gray-500 flex items-center">
                        <span class="text-lg icon-[material-symbols--check-rounded]"></span>
                        Draft included
                    </div>
                {/if}
            </div>
        </a>
        <MatchPreview matchInfo={match.data} slug={match.file_hash} ddragon={data.ddragon} sortByWinner={true} showLink={true} />
    </div>
    {/each}
</div>