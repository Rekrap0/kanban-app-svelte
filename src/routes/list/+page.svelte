<script lang="ts">
	import { socket } from '$lib/socket';
	import { notes } from '$lib/store.js';
	import { onDestroy, onMount } from 'svelte';
	import type { Note } from '../../types/note';
	import { generateNoteUUID } from '../../utils.js';
	import { goto } from '$app/navigation';
	import NavBar from '$lib/components/NavBar.svelte';
	import { updated } from '$app/state';

	onMount(() => {
		if (socket) {
			socket.emit('fetchNotes');
			socket.on('notesFetched', (n: Note[]) => {
				notes.set(n);
				socket.off('notesFetched');
			});

			socket.on('noteUpdated', (updatedNote: Note) => {
				console.log('Updated');
				notes.update((allNotes) =>
					allNotes.map((note) => (note.id === updatedNote.id ? updatedNote : note))
				);
			});
			socket.on('noteAdded', (newNote: Note) => {
				console.log('Added');
				notes.update((allNotes) => [...allNotes, newNote]);
			});
			socket.on('noteRemoved', (removedNote: Note) => {
				notes.update((allNotes) => allNotes.filter((n) => n.id !== removedNote.id));
			});
		}
	});
    let searchQuery = '';
    onDestroy(() => {
        socket.off();
    })
</script>

<div class="min-h-screen bg-gray-100 p-6">
	<NavBar />
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

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each $notes as note}
			<a
				href="/list/{note.id}"
				class="block rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
			>
				<h2 class="text-xl font-semibold text-gray-800">{note.title}</h2>
				{#if note.tags.length > 0}
					<div class="mt-2 flex flex-wrap gap-1">
						{#each note.tags as tag}
							<span class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
								{tag}
							</span>
						{/each}
					</div>
				{/if}
			</a>
		{/each}
	</div>

	<!-- Add new board button -->
	<button
		class="mt-6 rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
		on:click={() => {
			goto('/list/new');
		}}
	>
		+ Create New Note
	</button>
</div>
