<script lang="ts">
    import MatchPreview from '$lib/components/match-preview.svelte';
    import type { PageProps } from './$types';
    import type { Match } from './proxy+page.server';

    let { data }: PageProps = $props();
    let matches: Match[] = $derived(data.matches); // Matches from the page props

    let searchQuery = $state('');

    const filteredMatches = $derived(
        matches.filter(match => {
            return match.data.metadata.statsJson.some(player => 
                player.NAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
                player.RIOT_ID_GAME_NAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
                player.SKIN.toLowerCase().includes(searchQuery.toLowerCase())
            );
        })
    );
</script>


<div>
    <input
        type="text"
        placeholder="Filter matches by player or champion..."
        bind:value={searchQuery}
        class="mb-4 p-2 border rounded w-full"
    />

    {#each filteredMatches as match (match.id)}
    <div class="mb-3 rounded-lg">
        <a href={`/match/${match.file_hash}`} class="text-sm text-gray-500 mb-2">
            <div class="flex items-center space-x-4 text-gray-700 ml-2">
                <div class="text-xs font-medium text-gray-500">{new Date(match.data.date).toLocaleDateString()}</div>
                <div class="text-xs text-gray-500">{new Date(match.data.date).toLocaleTimeString()}</div>
                <div class="text-xs text-gray-500">{match.match_id}</div>
                <div class="text-xs text-gray-500">{match.data.gameVersion}</div>
            </div>
        </a>
        <MatchPreview matchInfo={match.data} slug={match.file_hash} />
    </div>
    {/each}
</div>