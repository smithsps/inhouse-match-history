<script lang="ts">
    import MatchPreview from '$lib/components/match-preview.svelte';
    import type { ROFL } from '$lib/services/parseRofl';
    import { onMount } from 'svelte';
    import type { PageProps } from './$types';

    let matches: ROFL[] = $state([]); // Array to hold match data
    let page = 0; // Current page for pagination
    let loading = $state(false); // Loading state
    let hasMore = $state(true); // Whether there are more matches to load

    let { data }: PageProps = $props();

    // Simulate fetching matches (replace with your API or data source)
    async function fetchMatches(page: number) {
        loading = true;
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock data (replace with actual API response)
        const newMatches = Array.from({ length: 5 }, (_, i) => (
            data.exampleRofl
        ));

        // Append new matches to the list
        matches = [...matches, ...newMatches] as ROFL[];

        // Simulate end of data
        if (page >= 5) {
            hasMore = false;
        }

        loading = false;
    }

    // Load initial matches
    onMount(() => {
        fetchMatches(page);
    });

    // Handle scroll event
    function handleScroll() {
        const scrollPosition = window.innerHeight + window.scrollY;
        const bottomPosition = document.body.offsetHeight - 100;

        if (scrollPosition >= bottomPosition && !loading && hasMore) {
            page += 1;
            fetchMatches(page);
        }
    }

    // Attach scroll event listener
    onMount(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    });

    let searchQuery = $state(''); // Search query state
</script>

<style>
    .loading {
        text-align: center;
        margin: 1rem 0;
        font-size: 1.2rem;
        color: gray;
    }
</style>

<div>
    <input
        type="text"
        placeholder="Search matches..."
        bind:value={searchQuery}
        class="mb-4 p-2 border rounded w-full"
    />

    {#each matches.filter(match => match.filename.toLowerCase().includes(searchQuery.toLowerCase())) as match}
    <div class="mb-3 rounded-lg">
        <div class="text-sm text-gray-500 mb-2">
            {new Date(match.date).toLocaleDateString()} {new Date(match.date).toLocaleTimeString()} - {match.filename} - {match.gameVersion}
        </div>
        <MatchPreview matchInfo={match} />
    </div>
    {/each}

    {#if loading}
        <div class="loading">Loading...</div>
    {/if}

    {#if !hasMore && !loading}
        <div class="loading">No more matches to load.</div>
    {/if}
</div>