<script lang="ts">
	import { socket } from '$lib/socket';
	import { notes } from '$lib/store.js';
	import { onMount } from 'svelte';
	import type { Note } from '../../../types/note';
	import { generateNoteUUID } from '../../../utils.js';
	import { goto } from '$app/navigation';
    const newNote: Note = {
    id: generateNoteUUID(),
    title: 'New Note',
    tags: [],
    description: '',
    modifiedAt: "",
    versions:[]
  }
	function createNote(note: Note): void {
		notes.update((n) => [...n, note]);
		if (socket) {
			socket.emit('createNote', note);
		}
	}
	onMount(() => {
        createNote(newNote);
		if (socket) {
			socket.emit('addNote',newNote);
            goto("/list/" + newNote.id);
		}
	});
</script>
