<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { boards, cards, activeBoard } from '$lib/store.js';
	import { onMount, onDestroy } from 'svelte';
	import { socket } from '$lib/socket.js';

	interface Board {
		id: string;
		name: string;
		columns: string[];
	}

	interface Card {
		id: string;
		title: string;
		board: string;
		column: string;
		tags: string[];
		dueDate: string;
		assignedTo: string[];
		description: string;
		comments: Comment[];
		versions: any[];
	}

	interface Comment {
		author: string;
		text: string;
		timestamp: string;
	}

	export let boardId: string = $activeBoard;
	let showModal = false;
	let selectedCard: Card | null = null;
	let columnCards: { [key: string]: Card[] } = {};
	let editing = false;
	let editingTitle = false;
	let editingDescription = false;
	let editingDueDate = false;
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
			socket.off('cardUpdated');
		}
	});

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
			if (socket) {
				socket.emit('updateCard', updatedCard);
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

								{#if card.assignedTo.length > 0}
									<div class="mt-2 flex gap-1">
										{#each card.assignedTo as user}
											<span class="text-sm text-gray-600">
												{user}
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
						type="text"
						bind:value={selectedCard.title}
						class="rounded border p-1 text-2xl font-bold"
						on:blur={() => {
							editingTitle = false;
							editing = false;
						}}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								editingTitle = false;
								editing = false;
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
								editing = false;
								editingTitle = false;
								editingDescription = false;
								editingDueDate = false;
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
							editing = false;
							editingTitle = false;
							editingDescription = false;
							editingDueDate = false;
							if (selectedCard) updateCardDetails(selectedCard);
						}

						showModal = false;
						selectedCard = null;
						editing = false;
						columnCards = { ...columnCards };
					}}
				>
					✕
				</button>
			</div>

			<div class="mt-4">
				{#if editingDescription}
					<textarea
						bind:value={selectedCard.description}
						class="w-full rounded border p-1"
						on:blur={() => {
							editingDescription = false;
							editing = false;
						}}
						on:keydown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey && selectedCard) {
								editingDescription = false;
								editing = false;
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
								editing = false;
								editingTitle = false;
								editingDescription = false;
								editingDueDate = false;
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
							type="date"
							bind:value={selectedCard.dueDate}
							class="rounded border p-1"
							on:blur={() => {
								if (selectedCard) {
									editingDueDate = false;
									editing = false;
									updateCardDetails(selectedCard);
								}
							}}
						/>
					{:else}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<p
							class="cursor-pointer"
							on:click={() => {
								if (!editing) {
									editingDueDate = true;
									editing = true;
								} else {
									editing = false;
									editingTitle = false;
									editingDescription = false;
									editingDueDate = false;
									if (selectedCard) updateCardDetails(selectedCard);
								}
							}}
						>
							{new Date(selectedCard.dueDate).toLocaleDateString()}
						</p>
					{/if}
				</div>

				<div class="mt-4">
					<h3 class="font-semibold">Assigned To</h3>
					<div class="flex gap-2">
						{#each selectedCard.assignedTo as user}
							<span class="rounded bg-gray-100 px-2 py-1">
								{user}
							</span>
						{/each}
					</div>
				</div>

				<div class="mt-4">
					<h3 class="font-semibold">Tags</h3>
					<div class="flex flex-wrap gap-2">
						{#each selectedCard.tags as tag}
							<span class="rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800">
								{tag}
							</span>
						{/each}
					</div>
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
									selectedCard.comments = [...selectedCard.comments, comment];
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
