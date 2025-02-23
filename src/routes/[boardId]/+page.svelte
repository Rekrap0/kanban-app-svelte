<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { boards, cards, activeBoard } from '$lib/store.js';
	import { onMount, onDestroy } from 'svelte';
	import { socket } from '$lib/socket.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Card } from '../../types/cards';
	import type { Board } from '../../types/board';
	import { scale } from 'svelte/transition';

	const boardId = $page.params.boardId;
	activeBoard.set(boardId);
	let editingTitle = false;
	let isDragging = false;
	let columnCards: { [key: string]: Card[] } = {};
	$: currentBoard = $boards.find((b: Board) => b.id === boardId);

	// Update columnCards whenever cards or boardId changes
	$: {
		if (currentBoard) {
			columnCards = {
				'': [], // preserve for delete
				...currentBoard.columns.reduce(
					(acc, column) => {
						acc[column] = $cards.filter((card) => card.board === boardId && card.column === column);
						return acc;
					},
					{} as { [key: string]: Card[] }
				)
			};
		}
	}

	// Socket.IO event handlers
	onMount(() => {
		if (socket) {
			socket.emit('joinBoard', boardId);
			socket.on('cardUpdated', (updatedCard: Card) => {
				if (updatedCard.board === boardId) {
					cards.update((allCards) =>
						allCards.map((card) => (card.id === updatedCard.id ? updatedCard : card))
					);
				}
			});
			socket.on('cardAdded', (newCard: Card) => {
				if (newCard.board === boardId) {
					cards.update((allCards) => [...allCards, newCard]);
				}
			});
			socket.on('cardRemoved', (removedCard: Card) => {
				if (removedCard.board === boardId) {
					cards.update((allCards) => allCards.filter((c) => c.id !== removedCard.id));
				}
			});
		}
	});

	onDestroy(() => {
		if (socket) {
			socket.emit('leaveBoard', boardId);
			socket.off('cardUpdated');
			socket.off('cardAdded');
		}
	});

	function handleDndConsider(event: CustomEvent<{ items: Card[] }>, targetColumn: string) {
		const { items } = event.detail;
		columnCards[targetColumn] = items;
		isDragging = true;
	}

	function handleDndFinalize(event: CustomEvent<{ items: Card[] }>, targetColumn: string) {
		const { items } = event.detail;
		columnCards[targetColumn] = items;
		isDragging = false;

		const movedCard = items.find((item) => item.column !== targetColumn);
		if (movedCard) {
			if (targetColumn === '') {
				deleteCard(movedCard);
				return;
			}

			const updatedCard: Card = { ...movedCard, column: targetColumn };

			cards.update((allCards) =>
				allCards.map((card) => (card.id === updatedCard.id ? updatedCard : card))
			);

			if (socket?.connected) {
				socket.emit('updateCard', updatedCard, (error: any) => {
					if (error) {
						console.error('Error updating card:', error);
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

	function openCard(card: Card) {
		goto(`/${boardId}/${card.id}`);
	}

	function createCard(column: string): void {
		const newCard: Card = {
			id: crypto.randomUUID(),
			title: 'New Card',
			description: '',
			board: boardId,
			column: column,
			tags: [],
			dueDate: '',
			comments: [],
			versions: []
		};

		cards.update((allCards) => [...allCards, newCard]);
		if (socket?.connected) {
			socket.emit('newCard', newCard);
		}

		openCard(newCard);
	}

	function deleteCard(deletedCard: Card): void {
		cards.update((allCards) => allCards.filter((c) => c.id !== deletedCard.id));
		if (socket?.connected) {
			if (socket?.connected) {
				socket.emit('deleteCard', deletedCard);
			}
		}
	}




</script>

<div class="min-h-screen bg-gray-100 p-6">
	<a href="/" class="text-gray-600 hover:text-gray-800">← Back to Boards</a>
	<div class="mb-8 flex items-center justify-between">
		{#if !isDragging}
			{#if currentBoard}
				{#if !editingTitle}
					<h1 class="flex h-20 items-center text-3xl font-bold text-gray-800" on:click={() => (editingTitle = true)}>
						{currentBoard.name}
					</h1>
				{:else}
					<input
						autofocus
						type="text"
						bind:value={currentBoard.name}
						class="rounded flex h-20 items-center text-3xl font-bold text-gray-800"
						on:focusout={() => {
							editingTitle = false;
						}}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								editingTitle = false;
							}
						}}
					/>
				{/if}
			{/if}
		{:else}
			<div
				class="grid h-20 w-full items-center justify-center rounded-lg border-2 border-dashed border-red-300 bg-red-100 transition-colors hover:bg-red-200"
				use:dndzone={{
					items: columnCards[''] || [],
					centreDraggedOnCursor: false
				}}
				on:consider={(e) => handleDndConsider(e, '')}
				on:finalize={(e) => handleDndFinalize(e, '')}
			>
				<div class="text-center text-red-500">Delete card</div>
			</div>
		{/if}
	</div>

	{#if currentBoard}
		<div class="flex gap-6 overflow-x-auto pb-4">
			{#each currentBoard.columns as column}
				<div class="flex h-full min-w-[300px] flex-col rounded-lg bg-gray-200 p-4">
					<h2 class="mb-4 text-lg font-semibold text-gray-700 capitalize">
						{column.replace('_', ' ')}
					</h2>

					<div
						class="flex min-h-20 flex-1 flex-col gap-2"
						use:dndzone={{
							items: columnCards[column] || [],
							centreDraggedOnCursor: true
						}}
						on:consider={(e) => handleDndConsider(e, column)}
						on:finalize={(e) => handleDndFinalize(e, column)}
					>
						{#each columnCards[column] || [] as card (card.id)}
							<div
								class="cursor-pointer bg-white"
								on:click={() => openCard(card)}
								on:keydown={(e) => e.key === 'Enter' && openCard(card)}
								role="button"
								tabindex="0"
							>
								<div class="width-100 rounded-md p-4 shadow transition-shadow hover:shadow-md">
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
							</div>
						{/each}
					</div>
					<button
						class="mt-4 w-full rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
						on:click={() => createCard(column)}
					>
						+ Add Card
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-gray-600">Board not found</p>
	{/if}
</div>
