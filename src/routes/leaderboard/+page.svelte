<script>
    const { data } = $props();
    let leaderboard = $derived(data.leaderboard || []); // Assuming leaderboard data is passed in props
</script>

<h1 class="text-2xl font-bold mb-4">Leaderboard</h1>

<table class="table-auto w-full border-collapse border border-gray-300">
    <thead>
        <tr class="bg-gray-100">
            <th class="border border-gray-300 px-4 py-2 text-left">Rank</th>
            <th class="border border-gray-300 px-4 py-2 text-left">Player</th>
            <th class="border border-gray-300 px-4 py-2 text-left">Wins</th>
            <th class="border border-gray-300 px-4 py-2 text-left">Losses</th>
        </tr>
    </thead>
    <tbody>
        {#each leaderboard as player, index}
            <tr class="{index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100">
                <td class="border border-gray-300 px-4 py-2">{index + 1}</td>
                <td class="border border-gray-300 px-4 py-2">{player.name}</td>
                <td class="border border-gray-300 px-4 py-2">{player.wins}</td>
                <td class="border border-gray-300 px-4 py-2">{player.losses}</td>
            </tr>
        {/each}
    </tbody>
</table>
