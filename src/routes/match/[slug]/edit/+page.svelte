<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import type { Match } from '$lib/models/match';
  import type { SubmitFunction } from '@sveltejs/kit';
  import DraftScraper from '$lib/components/draft-scraper.svelte';
  import DraftDisplay from '$lib/components/draft-display.svelte';
  import type { DraftState } from '$lib/models/draft';

  let { data } = $props<{ data: PageData & { match: Match; ddragon: any } }>();
  let match = $derived(data.match);
  let error: string | null = $state(null);
  let success: string | null = $state(null);
  let draftState: DraftState | undefined = $derived(match.draft_data);

  function handleDraftScraped(draft: DraftState) {
    match.draft_data = draft;
    draftState = draft;
  }

  const handleSubmit: SubmitFunction = async ({ formData, action }) => {
    try {
      if (draftState) {
        formData.append('draft_data', JSON.stringify(draftState));
      }

      const response = await fetch(action, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to update match');
      }

      success = 'Match updated successfully';
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'An error occurred';
      success = null;
    }
  };

  async function handleDelete() {
    if (confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      try {
        const response = await fetch(`/match/${match.file_hash}/delete`, {
          method: 'GET'
        });

        if (response.ok) {
          window.location.href = '/';
        } else {
          error = 'Failed to delete match';
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'An error occurred while deleting the match';
      }
    }
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <a
    href="/match/{match.file_hash}"
    class="text-sm text-gray-500 hover:underline mb-4"
    >
    Back to Match
  </a>
  <h1 class="text-2xl font-bold mb-6">Edit Match</h1>

  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <span class="block sm:inline">{error}</span>
    </div>
  {/if}

  {#if success}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
      <span class="block sm:inline">{success}</span>
    </div>
  {/if}

  <form
    method="POST"
    use:enhance={handleSubmit}
    class="space-y-6"
  >
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <label for="mvp_player" class="block text-sm font-medium text-gray-700">MVP Player</label>
        <input
          type="text"
          id="mvp_player"
          name="mvp_player"
          value={match.mvp_player || ''}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label for="match_date" class="block text-sm font-medium text-gray-700">Match Date</label>
        <input
          type="datetime-local"
          id="match_date"
          name="match_date"
          value={new Date(match.match_date).toISOString().slice(0, 16)}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
        />
      </div>
    </div>

    <div class="mt-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4">Draft Information</h2>
      
      <DraftScraper onDraftScraped={handleDraftScraped} />

      {#if draftState}
        <div class="mt-4">
          <DraftDisplay draftState={draftState} ddragon={data.ddragon} />
        </div>
      {/if}
    </div>

    <div class="flex justify-center space-x-3">
      <div class="flex space-x-3">
        <button
          type="submit"
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Changes
        </button>
      </div>
    </div>
    <div class="mt-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">Delete Match</h2>
      <div class="space-y-3">
        <span class="text-sm text-gray-500">This action cannot be undone.</span>
        <br/>
        <button
          type="button"
          onclick={handleDelete}
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete Match
        </button>
      </div>
    </div>

    <div class="mt-8">
      <h2 class="text-xl font-bold text-gray-800">Raw Data</h2>
      <span class="text-sm text-gray-500">These fields cannot be edited.</span>
      
      <div class="space-y-4 mt-4">
        <div>
          <label for="match_data" class="block text-sm font-medium text-gray-700">Match Data (JSON)</label>
          <textarea
            id="match_data"
            name="match_data"
            readonly
            class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
            rows="10"
          >{JSON.stringify(match.data, null, 2)}</textarea>
        </div>

        <div>
          <label for="draft_data" class="block text-sm font-medium text-gray-700">Draft Data (JSON)</label>
          <textarea
            id="draft_data"
            name="draft_data"
            readonly
            class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
            rows="10"
          >{JSON.stringify(draftState || match.draft_data, null, 2)}</textarea>
        </div>

        <div>
          <label for="match_metadata" class="block text-sm font-medium text-gray-700">Match Metadata (JSON)</label>
          <textarea
            id="match_metadata"
            name="match_metadata"
            readonly
            class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
            rows="10"
          >{JSON.stringify({
            id: match.id,
            file_size: match.file_size,
            file_hash: match.file_hash,
            match_id: match.match_id,
            file_name: match.file_name,
            created_at: match.created_at,
            updated_at: match.updated_at
          }, null, 2)}</textarea>
        </div>
      </div>
    </div>
  </form>
</div> 