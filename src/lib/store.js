import { writable } from 'svelte/store';
/**
 * @type {import('svelte/store').Writable<import('../types/board').Board[]>}
 */
export const boards = writable([
]);
/**
 * @type {import('svelte/store').Writable<import('../types/card').Card[]>}
 */
export const cards = writable([]);
/**
 * @type {import('svelte/store').Writable<import('../types/note').Note[]>}
 */
export const notes = writable([{
    id: 'abc123xyz',
    title: 'How to design a Note system',
    tags: ['Design', 'develop', 'notes'],
    description: '## Target\n1. View note rapidly\n2. Support markdowns\n3. Unique URL',
    versions:[]
  }]);
export const activeBoard = writable('');
export const activeNote = writable('');