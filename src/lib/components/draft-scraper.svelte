<script lang="ts">
    import type { DraftState } from "$lib/models/draft.js";

    let { onDraftScraped } = $props<{
        onDraftScraped: (draftState: DraftState) => void;
    }>();

    let draftScrapeState: "idle" | "scraping" | "done" | "error" = $state("idle");
    let draftState: DraftState | undefined = $state(undefined);

    function scrapeDraft(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input && input.value.includes("draftlol.dawe.gg")) {
            const id = input.value.split("draftlol.dawe.gg/")[1];
            const ws = new WebSocket(`wss://draftlol.dawe.gg`);
            draftScrapeState = "scraping";
            try {
                ws.onopen = () => {
                    ws.send(JSON.stringify({
                        "type":"joinroom",
                        "roomId": id
                    }));

                    ws.onmessage = (event) => {
                        console.log(event.data);
                        const data = JSON.parse(event.data);
                        if (data.type === "statechange") {
                            draftState = data.newState as DraftState;
                            onDraftScraped(draftState);
                        }

                        if (data.type === "error") {
                            draftScrapeState = "error";
                            ws.close();
                            return;
                        }

                        draftScrapeState = "done";
                        ws.close(); 
                    }
                }
            } catch (error) {
                console.error("Error connecting to websocket:", error);
                draftScrapeState = "error";
            }
        }                                               
    }
</script>

<div class="flex flex-col space-y-2 w-100">
    <label for="draft-lobby-id" class="text-sm font-medium text-gray-700">Set Draft URL (draftlol.dawe.gg)</label>
    <div class="flex items-center space-x-2">
        <input
            id="draft-lobby-id"
            name="draft-lobby-id"
            type="text"
            placeholder="https://draftlol.dawe.gg/..."
            class="block w-full text-sm text-gray-500 form-input rounded-md"
            onchange={scrapeDraft}
        />

        {#if draftScrapeState === "scraping"}
            <span class="icon-[line-md--loading-loop] text-gray-500 text-xl"></span>
        {:else if draftScrapeState === "done"}
            <span class="icon-[line-md--confirm-circle] text-green-500 text-xl"></span>
        {:else if draftScrapeState === "error"}
            <span class="icon-[line-md--alert-circle] text-red-500 text-xl" title="The draft lobby could not be loaded."></span>
        {/if}
    </div>
</div> 