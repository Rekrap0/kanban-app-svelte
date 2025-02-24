<script lang="ts">
	import { socket } from '$lib/socket';
    import { notes } from '$lib/store.js';
	import { onMount } from 'svelte';
    import type { Note } from '../../types/note';
    import { generateNoteUUID } from '../../utils.js';
	import { goto } from '$app/navigation';
    import NavBar from '$lib/components/NavBar.svelte';

    function createNote(note: Note): void {
		notes.update(n => [...n, note]);
		if (socket) {
			socket.emit('createNote', note);
		}
        
	}

    onMount(() => {
		if (socket) {
			socket.emit('fetchNotes');
			socket.on('notesFetched', (n: Note[]) => {
				notes.set(n);
                socket.off('notesFetched');
			});
		}
	});
</script>

<div class="min-h-screen bg-gray-100 p-6">

    <NavBar/>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each $notes as note}
            <a
                href="/list/{note.id}"
                class="block rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
            >
                <h2 class="text-xl font-semibold text-gray-800">{note.title}</h2>
                <p class="mt-2 text-gray-600">{note.description.slice(0, 20)}</p>
            </a>
        {/each}
    </div>

    <!-- Add new board button -->
    <button
        class="mt-6 rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        on:click={() => {
            goto("/list/new")
        }}
    >
        + Create New Note
    </button>
</div>