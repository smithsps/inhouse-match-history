<script lang="ts">
    import MatchPreview from '$lib/components/match-preview.svelte';
    import type { ROFL } from '$lib/services/parseRofl';
    import type { PageProps } from './$types';
    import type { Match } from './proxy+page.server';

    let { data }: PageProps = $props();
    let matches: Match[] = $derived(data.matches); // Matches from the page props

    let searchQuery = $state(''); // Search query state
</script>


<div>
    <input
        type="text"
        placeholder="Search matches..."
        bind:value={searchQuery}
        class="mb-4 p-2 border rounded w-full"
    />

    {#each matches as match (match.id)}
    <div class="mb-3 rounded-lg">
        <div class="text-sm text-gray-500 mb-2">
            {new Date(match.data.date).toLocaleDateString()} {new Date(match.data.date).toLocaleTimeString()} - {match.data.filename} - {match.data.gameVersion}
        </div>
        <MatchPreview matchInfo={match.data} />
    </div>
    {/each}
</div>