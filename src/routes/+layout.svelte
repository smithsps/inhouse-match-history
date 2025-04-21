<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-gray-100">
	<header class="bg-blue-600 text-white p-4">
		<h1 class="text-xl font-bold">In-House Match History</h1>
		<nav class="flex space-x-4">
			<a href="/" class="text-white hover:underline">Home</a>
			<a href="/upload" class="text-white hover:underline">Upload</a>
		</nav>
	</header>
	<main class="flex-grow p-4">
		{@render children()}
	</main>
</div>
