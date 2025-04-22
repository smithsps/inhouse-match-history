<script lang="ts">
    import MatchPreview from "$lib/components/match-preview.svelte";
    import type { ROFL } from "$lib/services/parseRofl";
    import { parseRofl } from "$lib/services/parseRofl";

    let { form } = $props();

    let matchInfo: ROFL | undefined = $state(undefined);

    function handleFileUpload(event: unknown) {
        const uploadedFile = (event as any).target.files[0];
        console.log(uploadedFile)
        if (uploadedFile) {
            parseRofl(uploadedFile).then((data) => {
                console.log(data);
                matchInfo = data;
            }).catch((error) => {
                console.error("Error parsing file:", error);
            });
        }
    }

    function convertDateToDatepickerInput() {
        if (matchInfo?.date) {
            const date = new Date(matchInfo.date);
            console.log(date.toISOString())
            const iso = date.toISOString().split(":");
            console.log(iso[0] + iso[1]);
            return iso[0] + ':' + iso[1]; // Format as YYYY-MM-DD
        }
        return "";
    }

    function handleDateChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (matchInfo) {
            matchInfo.date = new Date(input.valueAsNumber);
        }
    }
</script>

<form method="post" enctype="multipart/form-data">
    <div class="flex flex-col space-y-4">
        <label for="file-upload" class="text-lg font-medium text-gray-700">Upload a replay file:</label>
        <input id="file-upload" name="file" type="file" accept=".rofl" onchange={handleFileUpload} class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100" />
    </div>

    {#if form?.error}<p class="text-red-500 text-sm mt-2">{form?.error}</p>{/if}

    {#if matchInfo}
    <div class="flex flex-col space-y-4">
        <h2 class="text-xl font-bold text-gray-800 my-4">Match Preview</h2>
        <div class="flex flex-col space-y-2 w-100">
            <label for="match-date" class="text-sm font-medium text-gray-700">Set Match Date:</label>
            <input
                name="match-date"
                type="datetime-local"
                value={convertDateToDatepickerInput()}
                onchange="{handleDateChange}"
                class="block w-full text-sm text-gray-500 form-input rounded-md"
            />
        </div>
    

        {matchInfo.date}
        <MatchPreview matchInfo={matchInfo} />
        <subtitle class="text-sm text-gray-500">This is a preview of the match data extracted from the replay file.</subtitle>
        <!-- Submit button-->
        <button class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-50" type="submit">
            Submit Match Data
        </button>
    </div>
    {/if}
</form>