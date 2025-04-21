<script lang="ts">
    import MatchPreview from "$lib/components/match-preview.svelte";
    import type { ROFL } from "$lib/services/parseRofl";
    import { parseRofl } from "$lib/services/parseRofl";

    let matchInfo: ROFL | undefined = $state(undefined);

    function handleFileUpload(event: unknown) {
        const uploadedFile = (event as any).target.files[0];
        if (uploadedFile) {
            parseRofl(uploadedFile).then((data) => {
                console.log(data);
                matchInfo = data;
            }).catch((error) => {
                console.error("Error parsing file:", error);
            });
        }
    }
</script>

<div class="flex flex-col space-y-4">
    <label for="file-upload" class="text-lg font-medium text-gray-700">Upload a replay file:</label>
    <input id="file-upload" type="file" accept=".rofl" onchange={handleFileUpload} class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100" />
</div>

{#if matchInfo}
<div class="flex flex-col space-y-4">
    <h2 class="text-xl font-bold text-gray-800 mb-4">Match Preview</h2>
    <MatchPreview matchInfo={matchInfo} />
    <subtitle class="text-sm text-gray-500">This is a preview of the match data extracted from the replay file.</subtitle>
    <!-- Submit button-->
    <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-50" onclick={() => alert("Submit functionality not implemented yet")}>
        Submit Match Data
    </button>
</div>
{/if}