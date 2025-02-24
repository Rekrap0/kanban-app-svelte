<script lang="ts">
	import { goto } from "$app/navigation";
    import { onMount } from 'svelte';
    onMount(() => {
		goto("/boards")
	});
</script>

<div class="min-h-screen bg-gray-100 p-6">
    <h1 class="mb-8 text-3xl font-bold text-gray-800">Dashboard</h1>
</div>