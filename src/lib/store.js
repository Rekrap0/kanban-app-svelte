import { writable } from 'svelte/store';

export const boards = writable([
{ id: 'board-1', name: 'Main Board', columns: ['todo', 'in_progress', 'review', 'done'] }
]);

export const cards = writable([
    { id: '1', title: 'Setup SvelteKit', board: 'board-1', column: 'todo', tags: ['high-priority'], dueDate: '2025-02-25',  description: 'This is a test card', comments: [], versions: [] },
    { id: '2', title: 'Uninstall SvelteKit', board: 'board-1', column: 'in_progress', tags: ['high-priority'], dueDate: '2025-02-26', description: 'This is also a test card', comments: [], versions: [] },
]);

export const activeBoard = writable('board-1');