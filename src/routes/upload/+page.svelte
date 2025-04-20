<script>
    import { parseRofl } from "$lib/parseRofl";

    function handleFileUpload(event) {
        const uploadedFile = event.target.files[0];
        if (uploadedFile) {
            parseRofl(uploadedFile).then((data) => {
                console.log(data);
            }).catch((error) => {
                console.error("Error parsing file:", error);
            });
        }
    }
</script>

<div class="flex flex-col space-y-4">
    <label for="file-upload" class="text-lg font-medium text-gray-700">Upload a replay file:</label>
    <input id="file-upload" type="file" accept=".rofl" on:change={handleFileUpload} class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100" />
</div>