<script lang="ts">
	import '../app.css';
	
	let { data, children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-gray-100">
	<header class="bg-blue-600 text-white p-4">
		<div class="max-w-4xl mx-auto">
			<h1 class="text-xl flex justify-center font-bold">In-House Match History</h1>
			<nav class="flex justify-center items-center space-x-4 mt-2">
				<a href="/" class="text-white hover:underline">Matches</a>
				{#if data.user}
					<a href="/upload" class="text-white hover:underline">Upload</a>
				{/if}
				{#if data.user}
					<a href="/profile">
						<img src={`https://cdn.discordapp.com/avatars/${data.user.discord_id}/${data.user.discord_avatar}.png`} alt="User Avatar" class="w-8 h-8 rounded-full" />
					</a>
				{:else}
					<a href="/login" class="text-white hover:underline">Login</a>
				{/if}
			</nav>
		</div>
	</header>
	<main class="flex-grow p-4 w-6xl mx-auto">
		{@render children()}
	</main>
</div>
