<script lang="ts">
	import { socket } from '$lib/socket';
    import { boards, activeBoard } from '$lib/store.js';
	import { onMount } from 'svelte';
    import type { Board } from '../types/board';

    function selectBoard(boardId: string) {
        activeBoard.set(boardId);
    }

    function createBoard(board: Board): void {
		boards.update(b => [...b, board]);
		if (socket) {
			socket.emit('createBoard', board);
		}
        selectBoard(board.id);
	}

    onMount(() => {
		if (socket) {
			socket.emit('fetchBoards');
			socket.on('boardsFetched', (b: Board[]) => {
				boards.set(b);
                socket.off();
			});
		}
	});
</script>

<div class="min-h-screen bg-gray-100 p-6">
    <h1 class="mb-8 text-3xl font-bold text-gray-800">My Boards</h1>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each $boards as board}
            <a
                href="/{board.id}"
                class="block rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
                on:click={() => selectBoard(board.id)}
            >
                <h2 class="text-xl font-semibold text-gray-800">{board.name}</h2>
                <p class="mt-2 text-gray-600">{board.columns.length} columns</p>
            </a>
        {/each}
    </div>

    <!-- Add new board button -->
    <button
        class="mt-6 rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        on:click={() => {
            const newBoard: Board = {
                id: crypto.randomUUID(),
                name: 'New Board',
                columns: ['todo', 'in_progress', 'done']
            };
            createBoard(newBoard)
        }}
    >
        + Create New Board
    </button>
</div>