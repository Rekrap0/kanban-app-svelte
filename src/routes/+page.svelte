<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import Tags from 'svelte-tags-input';
	import { boards, cards, activeBoard } from '$lib/store.js';
	import { onMount, onDestroy } from 'svelte';
	import { socket } from '$lib/socket.js';
	import type { Card, Comment } from '../types/cards';
	import type { Board } from '../types/board';

	export let boardId: string = $activeBoard;
	let showModal = false;
	let selectedCard: Card | null = null;
	let columnCards: { [key: string]: Card[] } = {};
	let editing = false;
	let editingTitle = false;
	let editingDescription = false;
	let editingDueDate = false;
	let editingTags = false;
	let newComment = '';

	$: currentBoard = $boards.find((b: Board) => b.id === boardId);

	// Update columnCards whenever cards or boardId changes
	$: {
		if (currentBoard) {
			columnCards = currentBoard.columns.reduce(
				(acc, column) => {
					acc[column] = $cards.filter((card) => card.board === boardId && card.column === column);
					return acc;
				},
				{} as { [key: string]: Card[] }
			);
		}
	}

	// Socket.IO event handlers
	onMount(() => {
    if (socket) {
        // Join the board room when component mounts
        socket.emit('joinBoard', boardId);

        // Listen for card updates
        socket.on('cardUpdated', (updatedCard: Card) => {
            if (updatedCard.board === boardId) {
                cards.update((allCards) =>
                    allCards.map((card) => (card.id === updatedCard.id ? updatedCard : card))
                );
            }
        });
    }
});

onDestroy(() => {
    if (socket) {
        // Leave the board room when component is destroyed
        socket.emit('leaveBoard', boardId);
        socket.off('cardUpdated');
    }
});

	function resetEditingState() {
		editing = false;
		editingDescription = false;
		editingDueDate = false;
		editingTags = false;
		editingTitle = false;
	}

	function handleDndConsider(event: CustomEvent<{ items: Card[] }>, targetColumn: string) {
		const { items } = event.detail;
		columnCards[targetColumn] = items;
	}

	function handleDndFinalize(event: CustomEvent<{ items: Card[] }>, targetColumn: string) {
		const { items } = event.detail;
		columnCards[targetColumn] = items;

		// Find the moved card
		const movedCard = items.find((item) => item.column !== targetColumn);
		if (movedCard) {
			const updatedCard: Card = { ...movedCard, column: targetColumn };

			// Update local state
			cards.update((allCards) =>
				allCards.map((card) => (card.id === updatedCard.id ? updatedCard : card))
			);

			// Emit socket event for real-time sync
			if (socket?.connected) {
				socket.emit('updateCard', updatedCard, (error: any) => {
					if (error) {
						console.error('Error updating card:', error);
						// Optionally revert the local state change
						cards.update((allCards) =>
							allCards.map((card) => (card.id === movedCard.id ? movedCard : card))
						);
					}
				});
			} else {
				console.warn('Socket not connected, update will only be local');
			}
		}
	}

	function updateCardDetails(card: Card) {
		cards.update((allCards) => allCards.map((c) => (c.id === card.id ? card : c)));

		// Emit socket event for real-time sync
		if (socket) {
			socket.emit('updateCard', card);
		}
	}

	function openCard(card: Card) {
		selectedCard = card;
		showModal = true;
	}
</script>

<div class="min-h-screen bg-gray-100 p-6">
	<h1 class="mb-8 text-3xl font-bold text-gray-800">
		{currentBoard?.name || 'Kanban Board'}
	</h1>

	{#if currentBoard}
		<div class="flex gap-6 overflow-x-auto pb-4">
			{#each currentBoard.columns as column}
				<div class="flex h-full min-w-[300px] flex-col rounded-lg bg-gray-200 p-4">
					<h2 class="mb-4 text-lg font-semibold text-gray-700 capitalize">
						{column.replace('_', ' ')}
					</h2>

					<div
						class="flex min-h-screen flex-1 flex-col gap-2"
						use:dndzone={{
							items: columnCards[column] || []
						}}
						on:consider={(e) => handleDndConsider(e, column)}
						on:finalize={(e) => handleDndFinalize(e, column)}
					>
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						{#each columnCards[column] || [] as card (card.id)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								class="cursor-pointer rounded-md bg-white p-4 shadow transition-shadow hover:shadow-md"
								on:click={() => openCard(card)}
							>
								<h3 class="text-lg font-medium text-gray-800">{card.title}</h3>

								{#if card.dueDate}
									<p class="mt-2 text-sm text-gray-600">
										Due: {new Date(card.dueDate).toLocaleDateString()}
									</p>
								{/if}

								{#if card.tags.length > 0}
									<div class="mt-2 flex flex-wrap gap-1">
										{#each card.tags as tag}
											<span class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
												{tag}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-gray-600">Board not found</p>
	{/if}
</div>

{#if showModal && selectedCard}
	<div class="bg-opacity-50 fixed inset-0 flex items-center justify-center bg-black">
		<div class="m-4 w-full max-w-2xl rounded-lg bg-white p-6">
			<div class="flex items-start justify-between">
				{#if editingTitle}
					<input
						autofocus
						type="text"
						bind:value={selectedCard.title}
						class="rounded border p-1 text-2xl font-bold"
						on:focusout={() => {
							if (selectedCard) {
								resetEditingState();
								updateCardDetails(selectedCard);
							}
						}}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								resetEditingState();
								if (selectedCard) {
									updateCardDetails(selectedCard);
								}
							}
						}}
					/>
				{:else}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<h2
						class="cursor-pointer text-2xl font-bold"
						on:click={() => {
							if (!editing) {
								editingTitle = true;
								editing = true;
							} else {
								resetEditingState();
								if (selectedCard) updateCardDetails(selectedCard);
							}
						}}
					>
						{selectedCard.title}
					</h2>
				{/if}
				<button
					class="text-gray-500 hover:text-gray-700"
					on:click={() => {
						if (editing) {
							resetEditingState();
							if (selectedCard) updateCardDetails(selectedCard);
						}
						showModal = false;
						selectedCard = null;
						resetEditingState();
						columnCards = { ...columnCards };
					}}
				>
					✕
				</button>
			</div>

			<div class="mt-4">
				{#if editingDescription}
					<textarea
						autofocus
						bind:value={selectedCard.description}
						class="w-full rounded border p-1"
						on:focusout={() => {
							if (selectedCard) {
								resetEditingState();
								updateCardDetails(selectedCard);
							}
						}}
						on:keydown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey && selectedCard) {
								resetEditingState();
								updateCardDetails(selectedCard);
							}
						}}
					></textarea>
				{:else}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<p
						class="cursor-pointer text-gray-700"
						on:click={() => {
							if (!editing) {
								editingDescription = true;
								editing = true;
							} else {
								resetEditingState();
								if (selectedCard) updateCardDetails(selectedCard);
							}
						}}
					>
						{selectedCard.description}
					</p>
				{/if}

				<div class="mt-4">
					<h3 class="font-semibold">Due Date</h3>
					{#if editingDueDate}
						<input
							autofocus
							type="date"
							bind:value={selectedCard.dueDate}
							class="inline-block rounded border p-1"
							on:focusout={() => {
								if (selectedCard) {
									resetEditingState();
									updateCardDetails(selectedCard);
								}
							}}
						/>
						<!-- svelte-ignore a11y_invalid_attribute -->
					{:else}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<p
							class="inline-block cursor-pointer"
							on:click={() => {
								if (!editing) {
									editingDueDate = true;
									editing = true;
								} else {
									resetEditingState();
									if (selectedCard) updateCardDetails(selectedCard);
								}
							}}
						>
							{#if selectedCard.dueDate}
								{new Date(selectedCard.dueDate).toLocaleDateString()}
							{:else}
								<span class="text-stone-500 italic">Click to set due date</span>
							{/if}
						</p>
					{/if}
					<button
						class="inline-block underline"
						on:click={() => {
							if (selectedCard) {
								resetEditingState();
								selectedCard.dueDate = '';
								updateCardDetails(selectedCard);
							}
						}}
					>
						Clear
					</button>
				</div>

				<div class="mt-4">
					<h3 class="font-semibold">Tags</h3>
					<Tags
						bind:tags={selectedCard.tags}
						onTagAdded={() => updateCardDetails(selectedCard)}
						onTagRemoved={() => updateCardDetails(selectedCard)}
					></Tags>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
				</div>

				<div class="mt-4">
					<h3 class="font-semibold">Comments</h3>
					<div class="mt-2">
						{#each selectedCard.comments as comment}
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
								if (selectedCard) {
									selectedCard.comments = [comment, ...selectedCard.comments];
									newComment = '';
									updateCardDetails(selectedCard);
								}
							}
						}}
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
