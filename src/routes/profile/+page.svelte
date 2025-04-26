<div class="flex flex-col space-y-4 max-w-sm mx-auto">
    <form method="POST" action="?/logout">
        <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition cursor-pointer">
            Logout
        </button>
    </form>

    <form method="POST" action="?/logoutAll">
        <button class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition cursor-pointer">
            Logout of all instances
        </button>
    </form>
</div>
