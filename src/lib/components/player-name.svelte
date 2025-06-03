<script lang="ts">
    import { PlayerService } from '$lib/services/player.js';

    let { puuid, name } = $props<{
        puuid: string;
        name: string;
    }>();

    const altName = $derived.by(() => {
        return PlayerService.getPlayerNameOrDefault(puuid, name);
    });
</script>

<span class="font-medium text-gray-700 truncate">
    {#if altName !== name}
        <span title="{name} is an alt of {altName}">{name}*</span>
    {:else}
        {name}
    {/if}
</span> 