<script lang="ts">
    import { dndzone } from 'svelte-dnd-action';
    import { boards, cards, activeBoard } from '$lib/store.js';
    import { onMount, onDestroy } from 'svelte';
    import { socket } from '$lib/socket.js';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { Card } from '../../types/cards';
    import type { Board } from '../../types/board';

    const boardId = $page.params.boardId;
    activeBoard.set(boardId);
    
    let columnCards: { [key: string]: Card[] } = {};
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
    }

    function handleDndFinalize(event: CustomEvent<{ items: Card[] }>, targetColumn: string) {
        const { items } = event.detail;
        columnCards[targetColumn] = items;

        const movedCard = items.find((item) => item.column !== targetColumn);
        if (movedCard) {
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
</script>

<div class="min-h-screen bg-gray-100 p-6">
    <div class="mb-8 flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-800">
            {currentBoard?.name || 'Kanban Board'}
        </h1>
        <a href="/" class="text-gray-600 hover:text-gray-800">← Back to Boards</a>
    </div>

    {#if currentBoard}
        <div class="flex gap-6 overflow-x-auto pb-4">
            {#each currentBoard.columns as column}
                <div class="flex h-full min-w-[300px] flex-col rounded-lg bg-gray-200 p-4">
                    <h2 class="mb-4 text-lg font-semibold text-gray-700 capitalize">
                        {column.replace('_', ' ')}
                    </h2>

                    <div
                        class="flex min-h-15 flex-1 flex-col gap-2"
                        use:dndzone={{
                            items: columnCards[column] || []
                        }}
                        on:consider={(e) => handleDndConsider(e, column)}
                        on:finalize={(e) => handleDndFinalize(e, column)}
                    >
                        {#each columnCards[column] || [] as card (card.id)}
                            <div
                                class="cursor-pointer rounded-md bg-white p-4 shadow transition-shadow hover:shadow-md"
                                on:click={() => openCard(card)}
                                on:keydown={(e) => e.key === 'Enter' && openCard(card)}
                                role="button"
                                tabindex="0"
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
                        <button
                            class="mt-4 w-full rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                            on:click={() => createCard(column)}
                        >
                            + Add Card
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <p class="text-gray-600">Board not found</p>
    {/if}
</div>