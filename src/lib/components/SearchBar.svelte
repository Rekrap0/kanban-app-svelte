<script>
    export let searchQuery = '';
</script>

<div class="relative my-3">
    <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search cards..."
        class="rounded-lg w-full border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none"
    />
    <svg
        class="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
    </svg>
</div>
