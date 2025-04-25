<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-gray-100">
	<header class="bg-blue-600 text-white p-4">
		<div class="max-w-4xl mx-auto">
			<h1 class="text-xl flex justify-center font-bold">In-House Match History</h1>
			<nav class="flex justify-center space-x-4">
				<a href="/" class="text-white hover:underline">Matches</a>
				<a href="/login" class="text-white hover:underline">Login</a>
				<a href="/upload" class="text-white hover:underline">Upload</a>
			</nav>
		</div>
	</header>
	<main class="flex-grow p-4 w-6xl mx-auto">
		{@render children()}
	</main>
</div>
