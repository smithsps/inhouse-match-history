<script lang="ts">
    import type { DraftState } from "$lib/models/draft.js";
    import { initializeDdragon } from "$lib/services/ddragon";
    import { onMount } from 'svelte';

    let { draftState } = $props<{
        draftState: DraftState;
    }>();

    let ddragon = $state({
        championImages: {},
        summonerSpellImages: {}
    });

    onMount(async () => {
        ddragon = await initializeDdragon();
    });

    function getChampionImage(championId: string): string {
        return ddragon.championImages[championId.toLowerCase()] || '';
    }

    function getSummonerSpellImage(spellId: string): string {
        return ddragon.summonerSpellImages[spellId] || '';
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
                            <img 
                                src={getChampionImage(ban)} 
                                alt={ban}
                                class="w-6 h-6 rounded-sm opacity-50"
                                title={`Ban ${i+1}: ${ban}`}
                            />
                        {/each}
                    </div>
                    <!-- Second Ban Phase -->
                    <div class="flex gap-1">
                        {#each draftState.blueBans.slice(3) as ban, i}
                            <img 
                                src={getChampionImage(ban)} 
                                alt={ban}
                                class="w-6 h-6 rounded-sm opacity-50"
                                title={`Ban ${i+3}: ${ban}`}
                            />
                        {/each}
                    </div>
                </div>
            </div>
            <!-- Picks -->
            <div class="flex gap-2 justify-end">
                <div class="flex gap-4">
                    <!-- First Pick -->
                    <div class="flex gap-1">
                        <img 
                            src={getChampionImage(draftState.bluePicks[0])} 
                            alt={draftState.bluePicks[0]}
                            class="w-6 h-6 rounded-sm"
                            title={`Pick 1: ${draftState.bluePicks[0]}`}
                        />
                    </div>
                    <!-- Second Round Picks -->
                    <div class="flex gap-1">
                        {#each draftState.bluePicks.slice(1,3) as pick, i}
                            <img 
                                src={getChampionImage(pick)} 
                                alt={pick}
                                class="w-6 h-6 rounded-sm"
                                title={`Pick ${i+2}: ${pick}`}
                            />
                        {/each}
                    </div>
                    <!-- Third Round Picks -->
                    <div class="flex gap-1">
                        {#each draftState.bluePicks.slice(3) as pick, i}
                            <img 
                                src={getChampionImage(pick)} 
                                alt={pick}
                                class="w-6 h-6 rounded-sm"
                                title={`Pick ${i+4}: ${pick}`}
                            />
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
                            <img 
                                src={getChampionImage(ban)} 
                                alt={ban}
                                class="w-6 h-6 rounded-sm opacity-50"
                                title={`Ban ${5-i}: ${ban}`}
                            />
                        {/each}
                    </div>
                    <!-- First Ban Phase -->
                    <div class="flex gap-1">
                        {#each draftState.redBans.slice(0,3).reverse() as ban, i}
                            <img 
                                src={getChampionImage(ban)} 
                                alt={ban}
                                class="w-6 h-6 rounded-sm opacity-50"
                                title={`Ban ${3-i}: ${ban}`}
                            />
                        {/each}
                    </div>
                </div>
            </div>
            <!-- Picks -->
            <div class="flex gap-2">
                <div class="flex gap-4">
                    <!-- Last Pick -->
                    <div class="flex gap-1">
                        <img 
                            src={getChampionImage(draftState.redPicks[4])} 
                            alt={draftState.redPicks[4]}
                            class="w-6 h-6 rounded-sm"
                            title={`Pick 5: ${draftState.redPicks[4]}`}
                        />
                    </div>
                    <!-- Second Round Picks -->
                    <div class="flex gap-1">
                        {#each draftState.redPicks.slice(2,4).reverse() as pick, i}
                            <img 
                                src={getChampionImage(pick)} 
                                alt={pick}
                                class="w-6 h-6 rounded-sm"
                                title={`Pick ${4-i}: ${pick}`}
                            />
                        {/each}
                    </div>
                    <!-- First Round Picks -->
                    <div class="flex gap-1">
                        {#each draftState.redPicks.slice(0,2).reverse() as pick, i}
                            <img 
                                src={getChampionImage(pick)} 
                                alt={pick}
                                class="w-6 h-6 rounded-sm"
                                title={`Pick ${2-i}: ${pick}`}
                            />
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>