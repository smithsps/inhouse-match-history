<script lang="ts">
    import type { DraftState } from "$lib/models/draft.js";
    import type { DdragongRepository } from "$lib/services/ddragon";

    let { draftState, ddragon } = $props<{
        draftState: DraftState;
        ddragon: DdragongRepository;
    }>();

    function getChampionImage(champion: string, title: string, isBanned = false) {
        if (!champion || typeof champion !== 'string') {
            return `<div class="w-6 h-6 rounded-sm bg-gray-300" title="No Ban"></div>`;
        }

        return `<img 
            src="${ddragon.getChampionImage(champion)}" 
            alt="${champion}"
            class="w-6 h-6 rounded-sm ${isBanned ? 'opacity-50' : ''}"
            title="${title}"
        />`;
    }
</script>

<div class="grid grid-cols-2 gap-4">
    <!-- Blue Team Draft -->
    <div class="p-1 rounded-lg">
        <div class="space-y-2">
            <!-- Bans -->
            <div class="flex gap-2 justify-end">
                <div class="flex gap-4">
                    <!-- First Ban Phase -->
                    <div class="flex gap-1">
                        {#each draftState.blueBans.slice(0,3) as ban, i}
                            {@html getChampionImage(ban, `Ban ${i+1}: ${ban}`, true)}
                        {/each}
                    </div>
                    <!-- Second Ban Phase -->
                    <div class="flex gap-1">
                        {#each draftState.blueBans.slice(3) as ban, i}
                            {@html getChampionImage(ban, `Ban ${i+4}: ${ban}`, true)}
                        {/each}
                    </div>
                </div>
            </div>
            <!-- Picks -->
            <div class="flex gap-2 justify-end">
                <div class="flex gap-4">
                    <!-- First Pick -->
                    <div class="flex gap-1">
                        {@html getChampionImage(draftState.bluePicks[0], `Pick 1: ${draftState.bluePicks[0]}`)}
                    </div>
                    <!-- Second Round Picks -->
                    <div class="flex gap-1">
                        {#each draftState.bluePicks.slice(1,3) as pick, i}
                            {@html getChampionImage(pick, `Pick ${i+2}: ${pick}`)}
                        {/each}
                    </div>
                    <!-- Third Round Picks -->
                    <div class="flex gap-1">
                        {#each draftState.bluePicks.slice(3) as pick, i}
                            {@html getChampionImage(pick, `Pick ${i+4}: ${pick}`)}
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Red Team Draft -->
    <div class="p-1 rounded-lg">
        <div class="space-y-2">
            <!-- Bans -->
            <div class="flex gap-2">
                <div class="flex gap-4">
                    <!-- Second Ban Phase -->
                    <div class="flex gap-1">
                        {#each draftState.redBans.slice(3).reverse() as ban, i}
                            {@html getChampionImage(ban, `Ban ${5-i}: ${ban}`, true)}
                        {/each}
                    </div>
                    <!-- First Ban Phase -->
                    <div class="flex gap-1">
                        {#each draftState.redBans.slice(0,3).reverse() as ban, i}
                            {@html getChampionImage(ban, `Ban ${3-i}: ${ban}`, true)}
                        {/each}
                    </div>
                </div>
            </div>
            <!-- Picks -->
            <div class="flex gap-2">
                <div class="flex gap-4">
                    <!-- Last Pick -->
                    <div class="flex gap-1">
                        {@html getChampionImage(draftState.redPicks[4], `Pick 5: ${draftState.redPicks[4]}`)}
                    </div>
                    <!-- Second Round Picks -->
                    <div class="flex gap-1">
                        {#each draftState.redPicks.slice(2,4).reverse() as pick, i}
                            {@html getChampionImage(pick, `Pick ${4-i}: ${pick}`)}
                        {/each}
                    </div>
                    <!-- First Round Picks -->
                    <div class="flex gap-1">
                        {#each draftState.redPicks.slice(0,2).reverse() as pick, i}
                            {@html getChampionImage(pick, `Pick ${2-i}: ${pick}`)}
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>