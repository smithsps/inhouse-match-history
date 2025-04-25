<script>
    const discordAuthUrl = "/login/discord";
</script>

<main class="signin-container">
    <h1>Sign in with Discord</h1>
    <button on:click={() => window.location.href = discordAuthUrl} class="signin-button">
        Sign in with Discord
    </button>
</main>

<style>
    .signin-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background-color: #2c2f33;
        color: #ffffff;
        font-family: Arial, sans-serif;
    }

    h1 {
        margin-bottom: 20px;
    }

    .signin-button {
        background-color: #7289da;
        color: #ffffff;
        border: none;
        padding: 10px 20px;
        font-size: 16px;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .signin-button:hover {
        background-color: #5b6eae;
    }
</style>