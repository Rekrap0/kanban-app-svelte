import { writable } from 'svelte/store';
/**
 * @type {import('svelte/store').Writable<import('../types/board').Board[]>}
 */
export const boards = writable([
]);
/**
 * @type {import('svelte/store').Writable<import('../types/cards').Card[]>}
 */

export const cards = writable([
    
]);

export const activeBoard = writable('');