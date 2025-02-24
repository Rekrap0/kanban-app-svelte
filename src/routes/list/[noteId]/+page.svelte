<script lang="ts">
	import { page } from '$app/stores';
	import Tags from 'svelte-tags-input';
	import { notes } from '$lib/store.js';
	import { socket } from '$lib/socket.js';
	import { goto } from '$app/navigation';
	import type { Note } from '../../../types/note';
	import markdownit from 'markdown-it';

	const { noteId } = $page.params;
	const md = markdownit();

	let note: Note | null = $notes.find((n) => n.id === noteId) || null;

	let editingTitle = false;
	let editingDescription = false;

	function resetEditingState() {
		editingTitle = false;
		editingDescription = false;
	}

	function updateNote(updatedNote: Note) {
		notes.update((allNotes) => allNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n)));

		if (socket?.connected) {
			socket.emit('updateNote', updatedNote, (error: any) => {
				if (error) {
					console.error('Error updating card:', error);
					// Optionally handle error state
				}
			});
		}
	}
</script>

{#if note}
	<div class="min-h-screen bg-gray-100 p-6">
		<div class="h-full w-full rounded-lg bg-white p-6 shadow-lg">
			<div class="flex items-start justify-between">
				{#if editingTitle}
					<input
						autofocus
						type="text"
						bind:value={note.title}
						class="rounded border p-1 text-2xl font-bold"
						on:focusout={() => {
							resetEditingState();
							updateNote(note);
						}}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								resetEditingState();
								updateNote(note);
							}
						}}
					/>
				{:else}
					<h2 class="cursor-pointer text-2xl font-bold" on:click={() => (editingTitle = true)}>
						{note.title}
					</h2>
				{/if}

				<button class="text-gray-500 hover:text-gray-700" on:click={() => goto(`/list`)}>
					✕
				</button>
			</div>
			<div class="mt-4">
				<Tags
					bind:tags={note.tags}
					onTagAdded={() => updateNote(note)}
					onTagRemoved={() => updateNote(note)}
				/>
			</div>

			{#if editingDescription}
				<div class="h-[70vh] mt-4 flex flex-col">
					<textarea
						autofocus
						bind:value={note.description}
						class="h-full w-full flex-1 rounded border p-1"
						on:focusout={() => {
							resetEditingState();
							updateNote(note);
						}}
						on:keydown={(e) => {
							if (e.key === 'Enter' && e.ctrlKey) {
								resetEditingState();
								updateNote(note);
							}
						}}
					/>
				</div>
			{:else}
				<div class="mt-4 flex h-min-[70vh] flex-col">
					<div
						class="markdown-content cursor-pointer text-gray-700"
						on:click={() => (editingDescription = true)}
					>
						{@html md.render(note.description) || '<p>Click to start typing...</p>'}
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center bg-gray-100">
		<p class="text-gray-600">Note not found</p>
	</div>
{/if}
