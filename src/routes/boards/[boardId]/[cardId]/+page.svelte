<script lang="ts">
	import { page } from '$app/stores';
	import { cards } from '$lib/store.js';
	import { socket } from '$lib/socket.js';
	import Tags from 'svelte-tags-input';
	import { goto } from '$app/navigation';
	import type { Card, Comment } from '../../../../types/card';
	import markdownit from 'markdown-it';
	import { onDestroy, onMount } from 'svelte';
	import { get } from 'svelte/store';

	const { boardId, cardId } = $page.params;
	const md = markdownit();

	$: card = $cards.find((c) => c.id === cardId) || null;

	let editingTitle = false;
	let editingDescription = false;
	let editingDueDate = false;
	let newComment = '';

	function resetEditingState() {
		editingTitle = false;
		editingDescription = false;
		editingDueDate = false;
	}

	function updateCard(updatedCard: Card) {
		cards.update((allCards) => allCards.map((c) => (c.id === updatedCard.id ? updatedCard : c)));

		if (socket?.connected) {
			socket.emit('updateCard', updatedCard, (error: any) => {
				if (error) {
					console.error('Error updating card:', error);
					// Optionally handle error state
				}
			});
		}
	}

	onMount(() => {
		if (socket) {
			socket.on('cardUpdated', (updatedCard: Card) => {
				if (updatedCard.board === boardId && card?.id === cardId) {
					console.log('Updated');
					cards.update((allCards) =>
						allCards.map((card) => (card.id === updatedCard.id ? updatedCard : card))
					);
				}
			});
			if (get(cards).length == 0) {
				socket.emit('getCard',cardId);
				socket.on('cardDataReceived', (newCard: Card) => {
					cards.set([newCard]);	
					socket.off('cardDataReceived');
				});
			}
		}
	});

	onDestroy(() => {
		if (socket) {
			socket.off('cardUpdated');
		}
	});
</script>

{#if card}
	<div class="min-h-screen bg-gray-100 p-6">
		<div class="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-lg">
			<div class="flex items-start justify-between">
				{#if editingTitle}
					<input
						autofocus
						type="text"
						bind:value={card.title}
						class="rounded border p-1 text-2xl font-bold"
						on:focusout={() => {
							resetEditingState();
							updateCard(card);
						}}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								resetEditingState();
								updateCard(card);
							}
						}}
					/>
				{:else}
					<h2 class="cursor-pointer text-2xl font-bold" on:click={() => (editingTitle = true)}>
						{card.title}
					</h2>
				{/if}

				<button
					class="text-gray-500 hover:text-gray-700"
					on:click={() => goto(`/boards/${boardId}`)}
				>
					✕
				</button>
			</div>

			<div class="mt-4">
				{#if editingDescription}
					<textarea
						autofocus
						bind:value={card.description}
						class="w-full rounded border p-1"
						on:focusout={() => {
							resetEditingState();
							updateCard(card);
						}}
						on:keydown={(e) => {
							if (e.key === 'Enter' && e.ctrlKey) {
								resetEditingState();
								updateCard(card);
							}
						}}
					/>
				{:else}
					<div
						class="markdown-content cursor-pointer text-gray-700"
						on:click={() => (editingDescription = true)}
					>
						{@html md.render(card.description) || '<p>No description</p>'}
					</div>
				{/if}

				<div class="mt-4">
					<h3 class="font-semibold">Due Date</h3>
					{#if editingDueDate}
						<input
							autofocus
							type="date"
							bind:value={card.dueDate}
							class="inline-block rounded border p-1"
							on:focusout={() => {
								resetEditingState();
								updateCard(card);
							}}
						/>
					{:else}
						<p class="inline-block cursor-pointer" on:click={() => (editingDueDate = true)}>
							{#if card.dueDate}
								{new Date(card.dueDate).toLocaleDateString()}
							{:else}
								<span class="text-stone-500 italic">Click to set due date</span>
							{/if}
						</p>
					{/if}
					<button
						class="ml-2 inline-block underline"
						on:click={() => {
							card.dueDate = '';
							updateCard(card);
						}}
					>
						Clear
					</button>
				</div>

				<div class="mt-4">
					<h3 class="font-semibold">Tags</h3>
					<Tags
						bind:tags={card.tags}
						onTagAdded={() => updateCard(card)}
						onTagRemoved={() => updateCard(card)}
					/>
				</div>

				<div class="mt-4">
					<h3 class="font-semibold">Comments</h3>
					<div class="mt-2">
						{#each card.comments as comment}
							<div class="mb-2">
								<p class="text-sm text-gray-600">
									{comment.author} - {new Date(comment.timestamp).toLocaleString()}
								</p>
								<p class="text-gray-700">{comment.text}</p>
							</div>
						{/each}
					</div>
					<input
						type="text"
						bind:value={newComment}
						class="mt-2 w-full rounded border p-1"
						placeholder="Add a comment..."
						on:keydown={(e) => {
							if (e.key === 'Enter' && newComment.trim() !== '') {
								const comment = {
									author: 'Current User', // Replace with actual user
									text: newComment,
									timestamp: new Date().toISOString()
								};
								card.comments = [comment, ...card.comments];
								newComment = '';
								updateCard(card);
							}
						}}
					/>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center bg-gray-100">
		<p class="text-gray-600">Card not found</p>
	</div>
{/if}
