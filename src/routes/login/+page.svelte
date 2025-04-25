<script>
    const discordAuthUrl = "/login/discord";
</script>
<main class="flex flex-col items-center justify-center">
    <main class="flex flex-col items-center justify-center bg-gray-100">
        <div>
            <button 
                on:click={() => window.location.href = discordAuthUrl} 
                class="w-full px-6 py-3 text-white font-medium text-lg rounded-lg shadow-lg hover:shadow-xl transition duration-300 flex items-center justify-center bg-[#7289DA] hover:bg-[#5b6eae] focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-[#7289DA] cursor-pointer"
            >
                <div class="w-10 h-10 flex items-center justify-center bg-white rounded-full mr-3">
                    <img 
                        src="/discord-icon.svg" 
                        alt="Discord Logo" 
                        class="w-6 h-6"
                    />
                </div>
                Sign in with Discord
            </button>
        </div>
    </main>
</main>
